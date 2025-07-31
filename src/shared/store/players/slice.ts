import { createProducer } from "@rbxts/reflex";
import { Players, Workspace } from "@rbxts/services";

import { CONVEYOR_CONSTANTS } from "shared/constants/game";
import type {
	ConveyorEgg,
	MissedEgg,
	PlayerEgg,
	PlayerInventoryItem,
	PlayerPlacedItem,
} from "shared/types";
import { ItemType } from "shared/types";

import {
	ConveyorSpeedMode,
	type IslandState,
	type PlayerIslandState,
	type PlayersState,
	type PlayerState,
} from "./types";

// ==================== 辅助函数 ====================

/**
 * 创建玩家的初始状态.
 *
 * @returns 新的玩家状态对象.
 */
function createInitialPlayerState(): PlayerState {
	return {
		conveyor: {
			lastEggGenerationTime: 0,
			speedMode: ConveyorSpeedMode.Slow,
			speedModeHistory: [
				{
					speedMode: ConveyorSpeedMode.Slow,
					time: 0,
				},
			],
		},
		islands: {},
		plot: {
			index: math.max(Players.GetPlayers().size(), 1),
			islandId: "island1",
			playerId: "",
		},
	};
}

/**
 * 创建岛屿的初始状态.
 *
 * @returns 新的岛屿状态对象.
 */
function createInitialIslandState(): IslandState {
	return {
		eggs: {
			conveyor: [],
			missed: [],
		},
		expands: {},
		inventory: [
			{
				hammerId: "hammer1",
				instanceId: "hammer1",
				itemType: ItemType.Hammer,
				uses: 0,
			},
		],
		placed: [],
	};
}

/**
 * 获取或创建岛屿状态.
 *
 * @param islands - 玩家岛屿状态.
 * @param islandId - 岛屿ID.
 * @returns 岛屿状态.
 */
function getOrCreateIslandState(islands: PlayerIslandState, islandId: string): IslandState {
	return islands[islandId] ?? createInitialIslandState();
}

/**
 * 获取玩家当前岛屿状态.
 *
 * @param playerState - 玩家状态.
 * @returns 当前岛屿状态.
 */
function getCurrentIslandState(playerState: PlayerState): IslandState {
	return getOrCreateIslandState(playerState.islands, playerState.plot.islandId);
}

/**
 * 检查物品是否可以放回背包（只有宠物可以放回）.
 *
 * @param item - 物品.
 * @returns 是否可以放回背包.
 */
function canReturnToInventory(item: PlayerInventoryItem): boolean {
	return item.itemType === ItemType.Pet;
}

/**
 * 将蛋添加到背包，处理叠加逻辑.
 *
 * @param inventory - 当前背包物品列表.
 * @param newEgg - 要添加的蛋.
 * @returns 更新后的背包物品列表.
 */
function addEggToInventory(
	inventory: Array<PlayerInventoryItem>,
	newEgg: PlayerEgg,
): Array<PlayerInventoryItem> {
	const existingEggIndex = inventory.findIndex(items => {
		return (
			items.itemType === ItemType.Egg &&
			items.eggId === newEgg.eggId &&
			items.type === newEgg.type
		);
	});

	if (existingEggIndex !== -1) {
		return inventory.map((item, index) => {
			if (index === existingEggIndex) {
				return {
					...item,
					count: (item as PlayerEgg).count + 1,
				};
			}

			return item;
		});
	}

	return [...inventory, newEgg];
}

export const playersSlice = createProducer({} as PlayersState, {
	// ==================== 物品管理 ====================

	/**
	 * 添加物品到背包（蛋类型会叠加，其他类型直接添加）.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param item - 物品对象.
	 * @returns 更新后的状态.
	 */
	addItemToInventory: (state, playerId: string, item: PlayerInventoryItem): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		let newInventory: Array<PlayerInventoryItem>;

		// 如果是蛋类型，使用辅助函数处理叠加
		if (item.itemType === ItemType.Egg) {
			const eggItem = item;
			newInventory = addEggToInventory(currentIslandState.inventory, eggItem);
		} else {
			// 非蛋类型直接添加
			newInventory = [...currentIslandState.inventory, item];
		}

		const updatedIslandState = {
			...currentIslandState,
			inventory: newInventory,
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 清理过期的错过蛋.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @returns 更新后的状态.
	 */
	cleanupExpiredMissedEggs: (state, playerId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const currentTime = Workspace.GetServerTimeNow();
		const newMissedEggs = currentIslandState.eggs.missed.filter(
			egg => egg.expireTime > currentTime,
		);

		const updatedIslandState = {
			...currentIslandState,
			eggs: {
				...currentIslandState.eggs,
				missed: newMissedEggs,
			},
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 清除手持物品.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @returns 更新后的状态.
	 */
	clearHeldItem: (state, playerId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const updatedIslandState = {
			...currentIslandState,
			heldItemInstanceId: undefined,
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 从背包中取出物品并设置为手持物品.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param itemIndex - 物品在背包中的索引.
	 * @returns 更新后的状态.
	 */
	holdItemFromInventory: (state, playerId: string, itemIndex: number): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		if (itemIndex < 0 || itemIndex >= currentIslandState.inventory.size()) {
			return state;
		}

		const item = currentIslandState.inventory[itemIndex];
		if (!item) {
			return state;
		}

		// 如果已经有手持物品，先放回背包（只有宠物可以放回）
		const newInventory = [...currentIslandState.inventory];
		if (
			currentIslandState.heldItemInstanceId !== undefined &&
			currentIslandState.heldItemInstanceId !== ""
		) {
			const currentHeldItem = newInventory.find(
				inventoryItem => inventoryItem.instanceId === currentIslandState.heldItemInstanceId,
			);
			if (currentHeldItem && canReturnToInventory(currentHeldItem)) {
				// 手持物品已经在背包中，不需要额外操作
			}
		}

		// 从背包中移除要手持的物品
		newInventory.unorderedRemove(itemIndex);

		const updatedIslandState = {
			...currentIslandState,
			heldItemInstanceId: item.instanceId,
			inventory: newInventory,
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 蛋从传送带移动到错过区域.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param eggInstanceId - 蛋实例ID.
	 * @param timeData - 时间数据对象.
	 * @returns 更新后的状态.
	 */
	moveEggToMissed: (
		state,
		playerId: string,
		eggInstanceId: string,
		timeData: { expireTime: number; reserveTime: number },
	): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const eggIndex = currentIslandState.eggs.conveyor.findIndex(
			egg => egg.instanceId === eggInstanceId,
		);
		if (eggIndex === -1) {
			return state;
		}

		const conveyorEgg = currentIslandState.eggs.conveyor[eggIndex];
		if (!conveyorEgg) {
			return state;
		}

		const newConveyorEggs = [...currentIslandState.eggs.conveyor];
		newConveyorEggs.unorderedRemove(eggIndex);

		const missedEgg: MissedEgg = {
			...conveyorEgg,
			expireTime: timeData.expireTime,
			isExpired: false,
			reserveTime: timeData.reserveTime,
		} as MissedEgg;

		// 确保错过的蛋数量不超过最大限制
		const missedEggs = [...currentIslandState.eggs.missed, missedEgg];
		if (missedEggs.size() > CONVEYOR_CONSTANTS.MAX_MISSED_EGGS) {
			// 如果超过最大数量，移除最早的一个
			missedEggs.unorderedRemove(0);
		}

		const updatedIslandState = {
			...currentIslandState,
			eggs: {
				...currentIslandState.eggs,
				conveyor: newConveyorEggs,
				missed: [...currentIslandState.eggs.missed, missedEgg],
			},
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 将放置的宠物收回背包.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param petInstanceId - 要收回的宠物实例ID.
	 * @returns 更新后的状态.
	 */
	pickPetToInventory: (state, playerId: string, petInstanceId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);

		// 查找要收回的宠物
		const petIndex = currentIslandState.placed.findIndex(
			item => item.instanceId === petInstanceId && item.itemType === ItemType.Pet,
		);

		if (petIndex === -1) {
			return state;
		}

		const placedPet = currentIslandState.placed[petIndex];
		if (!placedPet || placedPet.itemType !== ItemType.Pet) {
			return state;
		}

		// 从放置物品中移除宠物
		const newPlacedItems = [...currentIslandState.placed];
		newPlacedItems.unorderedRemove(petIndex);

		// 将宠物转换为背包物品
		const petItem = placedPet as PlayerInventoryItem;

		const updatedIslandState = {
			...currentIslandState,
			inventory: [...currentIslandState.inventory, petItem],
			placed: newPlacedItems,
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 捡起传送带上的蛋并添加到背包.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param eggInstanceId - 蛋实例ID.
	 * @returns 更新后的状态.
	 */
	pickupConveyorEgg: (state, playerId: string, eggInstanceId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const eggIndex = currentIslandState.eggs.conveyor.findIndex(
			egg => egg.instanceId === eggInstanceId,
		);
		if (eggIndex === -1) {
			return state;
		}

		const conveyorEgg = currentIslandState.eggs.conveyor[eggIndex];
		if (!conveyorEgg) {
			return state;
		}

		// 从传送带移除蛋
		const newConveyorEggs = [...currentIslandState.eggs.conveyor];
		newConveyorEggs.unorderedRemove(eggIndex);

		// 转换为玩家蛋
		const playerEgg: PlayerEgg = {
			count: 1,
			eggId: conveyorEgg.eggId,
			instanceId: ItemType.Egg + "_" + conveyorEgg.eggId,
			itemType: ItemType.Egg,
			type: conveyorEgg.type,
		};

		// 使用辅助函数处理背包叠加逻辑
		const newInventory = addEggToInventory(currentIslandState.inventory, playerEgg);

		const updatedIslandState = {
			...currentIslandState,
			eggs: {
				...currentIslandState.eggs,
				conveyor: newConveyorEggs,
			},
			inventory: newInventory,
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 捡起错过的蛋并添加到背包.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param eggInstanceId - 蛋实例ID.
	 * @returns 更新后的状态.
	 */
	pickupMissedEgg: (state, playerId: string, eggInstanceId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const eggIndex = currentIslandState.eggs.missed.findIndex(
			egg => egg.instanceId === eggInstanceId,
		);
		if (eggIndex === -1) {
			return state;
		}

		const missedEgg = currentIslandState.eggs.missed[eggIndex];
		if (!missedEgg) {
			return state;
		}

		// 从错过区域移除蛋
		const newMissedEggs = [...currentIslandState.eggs.missed];
		newMissedEggs.unorderedRemove(eggIndex);

		// 转换为玩家蛋
		const playerEgg: PlayerEgg = {
			count: 1,
			eggId: missedEgg.eggId,
			instanceId: ItemType.Egg + "_" + missedEgg.eggId,
			itemType: ItemType.Egg,
			type: missedEgg.type,
		};

		// 使用辅助函数处理背包叠加逻辑
		const newInventory = addEggToInventory(currentIslandState.inventory, playerEgg);

		const updatedIslandState = {
			...currentIslandState,
			eggs: {
				...currentIslandState.eggs,
				missed: newMissedEggs,
			},
			inventory: newInventory,
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 从背包放置物品到当前岛屿.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param placedItem - 放置的物品.
	 * @returns 更新后的状态.
	 */
	placeItem: (state, playerId: string, placedItem: PlayerPlacedItem): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const updatedIslandState = {
			...currentIslandState,
			placed: [...currentIslandState.placed, placedItem],
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 从背包放置物品到当前岛屿.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param placedItem - 放置的物品.
	 * @returns 更新后的状态.
	 */
	placeItemFromInventory: (
		state,
		playerId: string,
		placedItem: PlayerPlacedItem,
	): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const updatedIslandState = {
			...currentIslandState,
			placed: [...currentIslandState.placed, placedItem],
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	// ==================== 玩家管理 ====================

	/**
	 * 玩家加入游戏 - 初始化玩家状态.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param playerState - 玩家状态对象.
	 * @returns 更新后的状态.
	 */
	playerJoined: (state, playerId: string, playerState?: PlayerState): PlayersState => {
		const initialPlayerState = playerState ?? createInitialPlayerState();

		initialPlayerState.plot.playerId = playerId;

		// 清除islandState中的eggs.conveyor和missed
		for (const [_islandId, islandState] of pairs(initialPlayerState.islands)) {
			islandState.eggs.conveyor = [];
			islandState.eggs.missed = [];
		}

		return {
			...state,
			[playerId]: initialPlayerState,
		};
	},

	/**
	 * 玩家离开游戏 - 清理玩家状态.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @returns 更新后的状态.
	 */
	playerLeft: (state, playerId: string): PlayersState => {
		return {
			...state,
			[playerId]: undefined,
		};
	},

	/**
	 * 从背包中移除指定蛋.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param itemInstanceId - 要移除的物品实例ID.
	 * @param count - 要移除的数量.
	 * @returns 更新后的状态.
	 */
	removeEggFromInventory: (
		state,
		playerId: string,
		itemInstanceId: string,
		count: number,
	): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const itemIndex = currentIslandState.inventory.findIndex(
			item => item.instanceId === itemInstanceId,
		);

		if (itemIndex === -1) {
			return state;
		}

		const item = currentIslandState.inventory[itemIndex];

		if (!item || item.itemType !== ItemType.Egg) {
			return state;
		}

		const newInventory = [...currentIslandState.inventory];
		if (item.count === count) {
			// 如果数量正好等于要移除的数量，则直接删除
			newInventory.unorderedRemove(itemIndex);
		} else {
			// 否则减少数量
			newInventory[itemIndex] = {
				...item,
				count: item.count - count,
			} as PlayerEgg;
		}

		const updatedIslandState = {
			...currentIslandState,
			inventory: newInventory,
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 从背包中移除指定物品.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param itemInstanceId - 要移除的物品实例ID.
	 * @returns 更新后的状态.
	 */
	removeItemFromInventory: (state, playerId: string, itemInstanceId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const itemIndex = currentIslandState.inventory.findIndex(
			item => item.instanceId === itemInstanceId,
		);

		if (itemIndex === -1) {
			return state;
		}

		const newInventory = [...currentIslandState.inventory];
		newInventory.unorderedRemove(itemIndex);

		const updatedIslandState = {
			...currentIslandState,
			inventory: newInventory,
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 从当前岛屿移除放置的蛋.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param eggInstanceId - 蛋实例ID.
	 * @returns 更新后的状态.
	 */
	removePlacedEgg: (state, playerId: string, eggInstanceId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const itemIndex = currentIslandState.placed.findIndex(
			item => item.instanceId === eggInstanceId,
		);

		if (itemIndex === -1) {
			return state;
		}

		const newPlacedItems = [...currentIslandState.placed];
		const removedItem = newPlacedItems[itemIndex];

		if (!removedItem) {
			return state;
		}

		newPlacedItems.unorderedRemove(itemIndex);

		const updatedIslandState = {
			...currentIslandState,
			placed: newPlacedItems,
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 从当前岛屿移除放置的物品.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param itemIndex - 物品索引.
	 * @returns 更新后的状态.
	 */
	removePlacedItem: (state, playerId: string, itemIndex: number): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const newPlacedItems = [...currentIslandState.placed];
		const removedItem = newPlacedItems[itemIndex];

		if (!removedItem) {
			return state;
		}

		newPlacedItems.unorderedRemove(itemIndex);

		let updatedIslandState = {
			...currentIslandState,
			placed: newPlacedItems,
		};

		// 检查是否是宠物类型，如果是则可以放回背包
		if ((removedItem.itemType as ItemType) === ItemType.Pet) {
			const petItem = removedItem as PlayerInventoryItem;
			updatedIslandState = {
				...updatedIslandState,
				inventory: [...updatedIslandState.inventory, petItem],
			};
		}

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 设置手持物品.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param item - 要手持的物品.
	 * @returns 更新后的状态.
	 */
	setHeldItem: (state, playerId: string, item: PlayerInventoryItem): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const updatedIslandState = {
			...currentIslandState,
			heldItemInstanceId: item.instanceId,
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 设置手持物品Id.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param itemInstanceId - 要手持的物品Id.
	 * @returns 更新后的状态.
	 */
	setHeldItemInstanceId: (
		state,
		playerId: string,
		itemInstanceId: string | undefined,
	): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const heldItem = currentIslandState.inventory.find(
			item => item.instanceId === itemInstanceId,
		);
		if (!heldItem) {
			itemInstanceId = undefined;
		}

		const updatedIslandState = {
			...currentIslandState,
			heldItemInstanceId:
				currentIslandState.heldItemInstanceId === itemInstanceId
					? undefined
					: itemInstanceId,
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 设置当前岛屿地块扩展状态为已扩展.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param expansionId - 扩展区域ID.
	 * @returns 更新后的状态.
	 */
	setPlotExpanded: (state, playerId: string, expansionId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const updatedIslandState = {
			...currentIslandState,
			expands: {
				...currentIslandState.expands,
				[expansionId]: true,
			},
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 在当前岛屿传送带上生成蛋.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param egg - 传送带蛋对象.
	 * @returns 更新后的状态.
	 */
	spawnEggOnConveyor: (state, playerId: string, egg: ConveyorEgg): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const updatedIslandState = {
			...currentIslandState,
			eggs: {
				...currentIslandState.eggs,
				conveyor: [...currentIslandState.eggs.conveyor, egg],
			},
		};

		return {
			...state,
			[playerId]: {
				...playerState,
				conveyor: {
					...playerState.conveyor,
					lastEggGenerationTime: Workspace.GetServerTimeNow(),
				},
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: updatedIslandState,
				},
			},
		};
	},

	/**
	 * 切换岛屿.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param newIslandId - 新岛屿ID.
	 * @returns 更新后的状态.
	 */
	switchIsland: (state, playerId: string, newIslandId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		// 确保新岛屿存在
		const newIslandState = getOrCreateIslandState(playerState.islands, newIslandId);

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[newIslandId]: newIslandState,
				},
				plot: {
					...playerState.plot,
					islandId: newIslandId,
				},
			},
		};
	},

	/**
	 * 更新传送带速度.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param speedMode - 新速度.
	 * @returns 更新后的状态.
	 */
	updateConveyorSpeedMode: (
		state,
		playerId: string,
		speedMode: ConveyorSpeedMode,
	): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		if (playerState.conveyor.speedMode === speedMode) {
			return state;
		}

		// 添加历史速度记录
		const newSpeedModeHistory = [
			...playerState.conveyor.speedModeHistory,
			{
				speedMode,
				time: Workspace.GetServerTimeNow(),
			},
		];
		if (newSpeedModeHistory.size() > 5) {
			newSpeedModeHistory.shift();
		}

		return {
			...state,
			[playerId]: {
				...playerState,
				conveyor: {
					...playerState.conveyor,
					speedMode,
					speedModeHistory: newSpeedModeHistory,
				},
			},
		};
	},

	/**
	 * 更新宠物的收益信息.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param petInstanceId - 宠物实例ID.
	 * @param earnings - 新的收益数据.
	 * @returns 更新后的状态.
	 */
	updatePetEarnings: (
		state,
		playerId: string,
		petInstanceId: string,
		earnings: {
			currentEarning: number;
			earningTime: number;
		},
	): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);

		return {
			...state,
			[playerId]: {
				...playerState,
				islands: {
					...playerState.islands,
					[playerState.plot.islandId]: {
						...currentIslandState,
						placed: currentIslandState.placed.map(item => {
							if (
								item.instanceId === petInstanceId &&
								item.itemType === ItemType.Pet
							) {
								return {
									...item,
									currentEarning: earnings.currentEarning,
									earningTime: earnings.earningTime,
								};
							}

							return item;
						}),
					},
				},
			},
		};
	},
});
