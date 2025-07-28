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
import { EggStatus, ItemType } from "shared/types";

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
		equipped: [
			{
				instanceId: "defaultHammer",
				itemType: ItemType.Hammer,
				placeRange: 0,
			},
		],
		expands: {},
		heldIndex: 0,
		inventory: [],
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
 * 检查装备槽是否有空位（假设最大装备数量为6）.
 *
 * @param islandState - 岛屿状态.
 * @returns 是否有空位.
 */
function hasEquippedSlot(islandState: IslandState): boolean {
	return islandState.equipped.size() < 6;
}

/**
 * 从当前岛屿的所有位置移除指定物品，确保唯一性.
 *
 * @param islandState - 岛屿状态.
 * @param instanceId - 物品实例ID.
 * @returns 更新后的岛屿状态.
 */
function removeItemFromAllLocations(islandState: IslandState, instanceId: string): IslandState {
	const newEquipped = islandState.equipped.filter(item => item.instanceId !== instanceId);
	let newHeldIndex = islandState.heldIndex;

	// 如果移除的物品是当前手持的物品，清除heldIndex
	if (
		islandState.heldIndex !== undefined &&
		islandState.equipped[islandState.heldIndex]?.instanceId === instanceId
	) {
		newHeldIndex = undefined;
	} else if (
		islandState.heldIndex !== undefined &&
		newEquipped.size() !== islandState.equipped.size()
	) {
		// 如果装备数组发生变化，需要调整heldIndex
		const heldItem = islandState.equipped[islandState.heldIndex];
		if (heldItem) {
			const newIndex = newEquipped.findIndex(item => item.instanceId === heldItem.instanceId);
			newHeldIndex = newIndex !== -1 ? newIndex : undefined;
		}
	}

	return {
		...islandState,
		equipped: newEquipped,
		heldIndex: newHeldIndex,
		inventory: islandState.inventory.filter(item => item.instanceId !== instanceId),
	};
}

export const playersSlice = createProducer({} as PlayersState, {
	// ==================== 物品管理 ====================

	/**
	 * 添加物品到当前岛屿背包（确保唯一性）.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param item - 物品对象.
	 * @returns 更新后的状态.
	 */
	addToInventory: (state, playerId: string, item: PlayerInventoryItem): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);

		// 先移除该岛屿所有位置的同一物品，确保唯一性
		const cleanedIslandState = removeItemFromAllLocations(currentIslandState, item.instanceId);

		// 根据装备槽空位情况决定放置位置
		let updatedIslandState: IslandState;
		if (hasEquippedSlot(cleanedIslandState)) {
			// 如果有装备槽空位，优先装备
			updatedIslandState = {
				...cleanedIslandState,
				equipped: [...cleanedIslandState.equipped, item],
			};
		} else {
			// 否则放入背包
			updatedIslandState = {
				...cleanedIslandState,
				inventory: [...cleanedIslandState.inventory, item],
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
	 * 清除手持物品（放回背包）.
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

		if (currentIslandState.heldIndex === undefined) {
			return state;
		}

		const heldItem = currentIslandState.equipped[currentIslandState.heldIndex];
		if (!heldItem) {
			return state;
		}

		// 从装备槽移除并放入背包
		const newEquipped = [...currentIslandState.equipped];
		newEquipped.unorderedRemove(currentIslandState.heldIndex);

		const updatedIslandState = {
			...currentIslandState,
			equipped: newEquipped,
			heldIndex: undefined,
			inventory: [...currentIslandState.inventory, heldItem],
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
	 * 装备物品（从背包到装备槽）.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param itemInstanceId - 物品实例ID.
	 * @returns 更新后的状态.
	 */
	equipItem: (state, playerId: string, itemInstanceId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);

		// 检查是否有装备槽位
		if (!hasEquippedSlot(currentIslandState)) {
			return state;
		}

		// 查找物品在背包中
		const itemIndex = currentIslandState.inventory.findIndex(
			item => item.instanceId === itemInstanceId,
		);
		if (itemIndex === -1) {
			return state;
		}

		const item = currentIslandState.inventory[itemIndex];
		if (!item) {
			return state;
		}

		const newInventory = [...currentIslandState.inventory];
		newInventory.unorderedRemove(itemIndex);

		const updatedIslandState = {
			...currentIslandState,
			equipped: [...currentIslandState.equipped, item],
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
	 * 捡起当前岛屿传送带上的蛋 - 优先装备，其次背包.
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

		const newConveyorEggs = [...currentIslandState.eggs.conveyor];
		newConveyorEggs.unorderedRemove(eggIndex);

		const playerEgg: PlayerEgg = {
			eggId: conveyorEgg.eggId,
			hatchLeftTime: 0,
			instanceId: conveyorEgg.instanceId,
			itemType: conveyorEgg.itemType,
			luckBonus: conveyorEgg.luckBonus,
			mutations: conveyorEgg.mutations,
			obtainTime: Workspace.GetServerTimeNow(),
			placeRange: conveyorEgg.placeRange,
			sizeLuckBonus: conveyorEgg.sizeLuckBonus,
			spawnTime: conveyorEgg.spawnTime,
			status: EggStatus.Unhatched,
		};

		// 获得蛋时，如果装备槽有空位直接装备，否则放入背包
		const hasSlot = hasEquippedSlot(currentIslandState);
		const updatedIslandState = {
			...currentIslandState,
			eggs: {
				...currentIslandState.eggs,
				conveyor: newConveyorEggs,
			},
			equipped: hasSlot
				? [...currentIslandState.equipped, playerEgg]
				: currentIslandState.equipped,
			inventory: hasSlot
				? currentIslandState.inventory
				: [...currentIslandState.inventory, playerEgg],
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
	 * 捡起错过的蛋 - 优先装备，其次背包.
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

		const newMissedEggs = [...currentIslandState.eggs.missed];
		newMissedEggs.unorderedRemove(eggIndex);

		const playerEgg: PlayerEgg = {
			eggId: missedEgg.eggId,
			hatchLeftTime: 0,
			instanceId: missedEgg.instanceId,
			itemType: missedEgg.itemType,
			luckBonus: missedEgg.luckBonus,
			mutations: missedEgg.mutations,
			obtainTime: Workspace.GetServerTimeNow(),
			placeRange: missedEgg.placeRange,
			sizeLuckBonus: missedEgg.sizeLuckBonus,
			spawnTime: missedEgg.spawnTime,
			status: EggStatus.Unhatched,
		};

		// 获得蛋时，如果装备槽有空位直接装备，否则放入背包
		const hasSlot = hasEquippedSlot(currentIslandState);
		const updatedIslandState = {
			...currentIslandState,
			eggs: {
				...currentIslandState.eggs,
				missed: newMissedEggs,
			},
			equipped: hasSlot
				? [...currentIslandState.equipped, playerEgg]
				: currentIslandState.equipped,
			inventory: hasSlot
				? currentIslandState.inventory
				: [...currentIslandState.inventory, playerEgg],
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
	 * 放置物品到当前岛屿.
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

		// 确保放置的物品从其他位置移除
		const cleanedIslandState = removeItemFromAllLocations(
			currentIslandState,
			placedItem.instanceId,
		);

		const updatedIslandState = {
			...cleanedIslandState,
			placed: [...cleanedIslandState.placed, placedItem],
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
	 * 卸下装备（从装备槽到背包）.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param itemInstanceId - 物品实例ID.
	 * @returns 更新后的状态.
	 */
	removeEquippedItem: (state, playerId: string, itemInstanceId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);

		// 查找物品在装备槽中
		const itemIndex = currentIslandState.equipped.findIndex(
			item => item.instanceId === itemInstanceId,
		);
		if (itemIndex === -1) {
			return state;
		}

		const item = currentIslandState.equipped[itemIndex];
		if (!item) {
			return state;
		}

		const newEquipped = [...currentIslandState.equipped];
		newEquipped.unorderedRemove(itemIndex);

		const updatedIslandState = {
			...currentIslandState,
			equipped: newEquipped,
			inventory: [...currentIslandState.inventory, item],
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
	 * 从背包移除物品.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param itemInstanceId - 物品实例ID.
	 * @returns 更新后的状态.
	 */
	removeFromInventory: (state, playerId: string, itemInstanceId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const updatedIslandState = {
			...currentIslandState,
			inventory: currentIslandState.inventory.filter(
				item => item.instanceId !== itemInstanceId,
			),
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
	 * @param itemInstanceId - 物品实例ID.
	 * @returns 更新后的状态.
	 */
	removeItem: (state, playerId: string, itemInstanceId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const itemIndex = currentIslandState.placed.findIndex(
			item => item.instanceId === itemInstanceId,
		);
		if (itemIndex === -1) {
			return state;
		}

		const newPlacedItems = [...currentIslandState.placed];
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
	 * 设置手持物品（确保唯一性）.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param itemInstanceId - 物品实例ID.
	 * @returns 更新后的状态.
	 */
	setHeldItem: (state, playerId: string, itemInstanceId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);

		// 查找物品在装备槽中的索引
		const equippedIndex = currentIslandState.equipped.findIndex(
			item => item.instanceId === itemInstanceId,
		);

		if (equippedIndex !== -1) {
			// 物品在装备槽中，直接设置heldIndex
			const updatedIslandState = {
				...currentIslandState,
				heldIndex: equippedIndex,
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
		}

		// 查找物品在背包中
		const inventoryItem = currentIslandState.inventory.find(
			item => item.instanceId === itemInstanceId,
		);

		if (!inventoryItem) {
			return state;
		}

		// 检查装备槽是否有空位
		if (!hasEquippedSlot(currentIslandState)) {
			return state;
		}

		// 从背包移除并添加到装备槽
		const updatedIslandState = {
			...currentIslandState,
			equipped: [...currentIslandState.equipped, inventoryItem],
			// 新添加的物品索引
			heldIndex: currentIslandState.equipped.size(),
			inventory: currentIslandState.inventory.filter(
				item => item.instanceId !== itemInstanceId,
			),
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
	 * 设置地块索引.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param index - 地块索引.
	 * @returns 更新后的状态.
	 */
	setPlotIndex: (state, playerId: string, index: number): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		return {
			...state,
			[playerId]: {
				...playerState,
				plot: {
					...playerState.plot,
					index,
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
	 * 切换手持物品（仅在装备槽中的物品之间切换）.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param itemInstanceId - 物品实例ID.
	 * @returns 更新后的状态.
	 */
	switchHeldItem: (state, playerId: string, itemInstanceId: string): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);

		// 查找物品在装备槽中的索引
		const equippedIndex = currentIslandState.equipped.findIndex(
			item => item.instanceId === itemInstanceId,
		);

		// 只有装备槽中的物品才能被设为手持
		if (equippedIndex === -1) {
			return state;
		}

		// 检查当前是否手持此物品
		if (currentIslandState.heldIndex === equippedIndex) {
			// 如果当前已手持此物品，则取消手持
			const updatedIslandState = {
				...currentIslandState,
				heldIndex: undefined,
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
		}

		// 设置为手持物品
		const updatedIslandState = {
			...currentIslandState,
			heldIndex: equippedIndex,
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
	 * 更新当前岛屿上物品的位置.
	 *
	 * @param state - 当前状态.
	 * @param playerId - 玩家ID.
	 * @param itemInstanceId - 物品实例ID.
	 * @param newPosition - 新位置.
	 * @returns 更新后的状态.
	 */
	updateItemPosition: (
		state,
		playerId: string,
		itemInstanceId: string,
		newPosition: CFrame,
	): PlayersState => {
		const playerState = state[playerId];
		if (!playerState) {
			return state;
		}

		const currentIslandState = getCurrentIslandState(playerState);
		const itemIndex = currentIslandState.placed.findIndex(
			item => item.instanceId === itemInstanceId,
		);
		if (itemIndex === -1) {
			return state;
		}

		const item = currentIslandState.placed[itemIndex];
		if (!item) {
			return state;
		}

		const updatedItem: PlayerPlacedItem = {
			...item,
			placedData: {
				...item.placedData,
				location: newPosition,
			},
		};

		const newPlacedItems = [...currentIslandState.placed];
		newPlacedItems[itemIndex] = updatedItem;

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
});
