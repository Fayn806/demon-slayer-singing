import { createSelector } from "@rbxts/reflex";

import { configs } from "shared/configs";
import type {
	ConveyorEgg,
	MissedEgg,
	PlacedBooster,
	PlacedEgg,
	PlayerInventoryItem,
	PlayerPlacedItem,
} from "shared/types";
import { BonusType, ItemType } from "shared/types";

import type { SharedState } from "..";
import type {
	ConveyorSpeedMode,
	IslandState,
	PlayerConveyorState,
	PlayerIslandState,
	PlayerPlotState,
	PlayerState,
	SpeedHistoryEntry,
} from "./types";

// ==================== 类型别名 ====================

/** 任意类型的蛋（传送带蛋或错过蛋）. */
type AnyEgg = ConveyorEgg | MissedEgg;

// ==================== 玩家状态选择器 ====================

/**
 * 选择玩家状态.
 *
 * @param playerId - 玩家ID.
 * @returns 玩家状态选择器函数.
 */
export function selectPlayerState(
	playerId: string,
): (state: SharedState) => PlayerState | undefined {
	return (state: SharedState) => state.players[playerId];
}

// ==================== 地块状态选择器 ====================

/**
 * 选择所有玩家地块状态.
 *
 * @returns 所有玩家地块状态选择器函数.
 */
export const selectAllPlayerPlots = createSelector(
	(state: SharedState) => state.players,
	players => {
		const plots: Array<PlayerPlotState> = [];
		for (const [_, player] of pairs(players)) {
			plots.push(player.plot);
		}

		return plots;
	},
);

/**
 * 选择玩家地块状态.
 *
 * @param playerId - 玩家ID.
 * @returns 玩家地块状态选择器函数.
 */
export function selectPlayerPlot(
	playerId: string,
): (state: SharedState) => PlayerPlotState | undefined {
	return (state: SharedState) => state.players[playerId]?.plot;
}

/**
 * 选择玩家地块Index.
 *
 * @param playerId - 玩家ID.
 * @returns 玩家地块状态选择器函数.
 */
export function selectPlayerPlotIndex(
	playerId: string,
): (state: SharedState) => number | undefined {
	return (state: SharedState) => state.players[playerId]?.plot.index;
}

// ==================== 基础玩家状态选择器 ====================

/**
 * 选择玩家传送带状态.
 *
 * @param playerId - 玩家ID.
 * @returns 玩家传送带状态选择器函数.
 */
export function selectPlayerConveyor(
	playerId: string,
): (state: SharedState) => PlayerConveyorState | undefined {
	return (state: SharedState) => state.players[playerId]?.conveyor;
}

/**
 * 选择玩家所有岛屿状态.
 *
 * @param playerId - 玩家ID.
 * @returns 玩家所有岛屿状态选择器函数.
 */
export function selectPlayerIslands(
	playerId: string,
): (state: SharedState) => PlayerIslandState | undefined {
	return (state: SharedState) => state.players[playerId]?.islands;
}

/**
 * 选择玩家当前岛屿ID.
 *
 * @param playerId - 玩家ID.
 * @returns 当前岛屿ID选择器函数.
 */
export function selectCurrentIslandId(
	playerId: string,
): (state: SharedState) => string | undefined {
	return (state: SharedState) => state.players[playerId]?.plot.islandId;
}

// ==================== 当前岛屿状态选择器 ====================

/**
 * 选择玩家当前岛屿状态.
 *
 * @param playerId - 玩家ID.
 * @returns 当前岛屿状态选择器函数.
 */
export function selectCurrentIslandState(
	playerId: string,
): (state: SharedState) => IslandState | undefined {
	return createSelector(selectPlayerState(playerId), (playerState): IslandState | undefined => {
		if (!playerState) {
			return undefined;
		}

		return playerState.islands[playerState.plot.islandId];
	});
}

// ==================== 蛋相关选择器 ====================

/**
 * 选择玩家当前岛屿的传送带蛋.
 *
 * @param playerId - 玩家ID.
 * @returns 传送带蛋选择器函数.
 */
export function selectConveyorEggs(playerId: string): (state: SharedState) => Array<ConveyorEgg> {
	return createSelector(
		selectCurrentIslandState(playerId),
		(islandState): Array<ConveyorEgg> => islandState?.eggs.conveyor ?? [],
	);
}

/**
 * 选择玩家当前岛屿的错过蛋.
 *
 * @param playerId - 玩家ID.
 * @returns 错过蛋选择器函数.
 */
export function selectMissedEggs(playerId: string): (state: SharedState) => Array<MissedEgg> {
	return createSelector(
		selectCurrentIslandState(playerId),
		(islandState): Array<MissedEgg> => islandState?.eggs.missed ?? [],
	);
}

/**
 * 选择蛋统计信息.
 *
 * @param playerId - 玩家ID.
 * @returns 蛋统计信息选择器函数.
 */
export function selectEggStats(playerId: string): (state: SharedState) => {
	conveyorCount: number;
	lastGenerationTime: number;
	missedCount: number;
	totalGenerated: number;
} {
	return createSelector(
		selectConveyorEggs(playerId),
		selectMissedEggs(playerId),
		selectPlayerConveyor(playerId),
		(conveyorEggs, missedEggs, conveyorState) => {
			return {
				conveyorCount: conveyorEggs.size(),
				lastGenerationTime: conveyorState?.lastEggGenerationTime ?? 0,
				missedCount: missedEggs.size(),
				totalGenerated: conveyorEggs.size() + missedEggs.size(),
			};
		},
	);
}

/**
 * 根据实例ID查找传送带蛋.
 *
 * @param playerId - 玩家ID.
 * @param eggInstanceId - 蛋实例ID.
 * @returns 传送带蛋选择器函数.
 */
export function selectConveyorEggById(
	playerId: string,
	eggInstanceId: string,
): (state: SharedState) => ConveyorEgg | undefined {
	return createSelector(selectConveyorEggs(playerId), (conveyorEggs): ConveyorEgg | undefined => {
		return conveyorEggs.find(egg => egg.instanceId === eggInstanceId);
	});
}

/**
 * 根据实例ID查找错过蛋.
 *
 * @param playerId - 玩家ID.
 * @param eggInstanceId - 蛋实例ID.
 * @returns 错过蛋选择器函数.
 */
export function selectMissedEggById(
	playerId: string,
	eggInstanceId: string,
): (state: SharedState) => MissedEgg | undefined {
	return createSelector(selectMissedEggs(playerId), (missedEggs): MissedEgg | undefined => {
		return missedEggs.find(egg => egg.instanceId === eggInstanceId);
	});
}

/**
 * 选择最新生成的传送带蛋.
 *
 * @param playerId - 玩家ID.
 * @returns 最新生成的传送带蛋选择器函数.
 */
export function selectLatestConveyorEgg(
	playerId: string,
): (state: SharedState) => ConveyorEgg | undefined {
	return createSelector(selectConveyorEggs(playerId), (conveyorEggs): ConveyorEgg | undefined => {
		if (conveyorEggs.size() === 0) {
			return undefined;
		}

		// 找到生成时间最晚的蛋
		let latestEgg: ConveyorEgg | undefined;
		let latestTime = 0;

		for (const egg of conveyorEggs) {
			if (egg.spawnTime > latestTime) {
				latestTime = egg.spawnTime;
				latestEgg = egg;
			}
		}

		return latestEgg;
	});
}

/**
 * 选择最新生成的错过蛋.
 *
 * @param playerId - 玩家ID.
 * @returns 最新生成的错过蛋选择器函数.
 */
export function selectLatestMissedEgg(
	playerId: string,
): (state: SharedState) => MissedEgg | undefined {
	return createSelector(selectMissedEggs(playerId), (missedEggs): MissedEgg | undefined => {
		if (missedEggs.size() === 0) {
			return undefined;
		}

		// 找到生成时间最晚的错过蛋
		let latestEgg: MissedEgg | undefined;
		let latestTime = 0;

		for (const egg of missedEggs) {
			if (egg.spawnTime > latestTime) {
				latestTime = egg.spawnTime;
				latestEgg = egg;
			}
		}

		return latestEgg;
	});
}

/**
 * 选择最新生成的蛋（包括传送带蛋和错过蛋）.
 *
 * @param playerId - 玩家ID.
 * @returns 最新生成的蛋选择器函数.
 */
export function selectLatestEgg(playerId: string): (state: SharedState) => AnyEgg | undefined {
	return createSelector(
		selectConveyorEggs(playerId),
		selectMissedEggs(playerId),
		(conveyorEggs, missedEggs): AnyEgg | undefined => {
			const allEggs = [...conveyorEggs, ...missedEggs];

			if (allEggs.size() === 0) {
				return undefined;
			}

			// 找到生成时间最晚的蛋
			let latestEgg: AnyEgg | undefined;
			let latestTime = 0;

			for (const egg of allEggs) {
				if (egg.spawnTime > latestTime) {
					latestTime = egg.spawnTime;
					latestEgg = egg;
				}
			}

			return latestEgg;
		},
	);
}

// ==================== 物品相关选择器 ====================

/**
 * 选择玩家当前岛屿的背包物品.
 *
 * @param playerId - 玩家ID.
 * @returns 背包物品选择器函数.
 */
export function selectInventoryItems(
	playerId: string,
): (state: SharedState) => Array<PlayerInventoryItem> {
	return createSelector(
		selectCurrentIslandState(playerId),
		(islandState): Array<PlayerInventoryItem> => islandState?.inventory ?? [],
	);
}

/**
 * 选择玩家当前岛屿的手持物品.
 *
 * @param playerId - 玩家ID.
 * @returns 手持物品选择器函数.
 */
export function selectHeldItem(
	playerId: string,
): (state: SharedState) => PlayerInventoryItem | undefined {
	return createSelector(
		selectCurrentIslandState(playerId),
		(islandState): PlayerInventoryItem | undefined => {
			if (!islandState) {
				return undefined;
			}

			const heldItemId = islandState.heldItemInstanceId;
			if (heldItemId === undefined || heldItemId === "") {
				return undefined;
			}

			return islandState.inventory.find(item => item.instanceId === heldItemId);
		},
	);
}

/**
 * 选择玩家当前手持物品在整个背包中的索引.
 *
 * @param playerId - 玩家ID.
 * @returns 手持物品在整个背包物品数组中的索引选择器函数（如果没有手持物品则返回undefined）.
 */
export function selectHeldItemIndex(playerId: string): (state: SharedState) => number | undefined {
	return createSelector(selectCurrentIslandState(playerId), (islandState): number | undefined => {
		if (!islandState) {
			return undefined;
		}

		const heldItemId = islandState.heldItemInstanceId;
		if (heldItemId === undefined || heldItemId === "") {
			return undefined;
		}

		// 在背包中查找手持物品的索引
		const index = islandState.inventory.findIndex(item => item.instanceId === heldItemId);
		return index >= 0 ? index : undefined;
	});
}

/**
 * 选择玩家是否手持锤子.
 *
 * @param playerId - 玩家ID.
 * @returns 是否手持锤子选择器函数.
 */
export function selectIsHoldingHammer(playerId: string): (state: SharedState) => boolean {
	return createSelector(
		selectHeldItem(playerId),
		(heldItem): boolean => heldItem?.itemType === ItemType.Hammer,
	);
}

/**
 * 选择玩家当前岛屿的放置物品.
 *
 * @param playerId - 玩家ID.
 * @returns 放置物品选择器函数.
 */
export function selectPlacedItems(
	playerId: string,
): (state: SharedState) => Array<PlayerPlacedItem> {
	return createSelector(
		selectCurrentIslandState(playerId),
		(islandState): Array<PlayerPlacedItem> => islandState?.placed ?? [],
	);
}

/**
 * 选择增益器范围内的放置蛋.
 *
 * @param playerId - 玩家ID.
 * @param boosterInstanceId - 增益器实例ID.
 * @param location
 * @param radius - 作用半径.
 * @returns 范围内放置蛋选择器函数.
 */
export function selectPlacedEggsInRange(
	playerId: string,
	location: CFrame,
	radius: number,
): (state: SharedState) => Array<PlacedEgg> {
	return createSelector(selectPlacedItems(playerId), (placedItems): Array<PlayerPlacedItem> => {
		const boosterPosition = location.Position;
		return placedItems.filter(item => {
			if (item.itemType === ItemType.Egg) {
				const itemPosition = item.location.Position;
				return itemPosition.sub(boosterPosition).Magnitude <= radius;
			}

			return false;
		});
	}) as (state: SharedState) => Array<PlacedEgg>;
}

export function selectPlacedEggBoosters(
	playerId: string,
	eggInstanceId: string,
): (state: SharedState) => Array<PlacedBooster> {
	return createSelector(
		selectPlacedItems(playerId), 
		selectPlacedItemById(playerId, eggInstanceId), 
		(placedItems: Array<PlayerPlacedItem>, egg: PlayerPlacedItem | undefined): Array<PlacedBooster> => {
			if (!egg) {
				return [];
			}

			// 只返回放置的增益器
			const boosters = placedItems.filter(item => item.itemType === ItemType.Booster);
			if (boosters.size() === 0) {
				return [];
			}

			// 只返回范围内的增益器
			const validBoosters = boosters.filter(item => {
				const boosterConfig = configs.BoomboxesConfig[(item as PlacedBooster).boosterId];
				if (!boosterConfig) {
					return false;
				}

				const { radius } = boosterConfig;
				const eggPosition = egg.location.Position;
				const boosterPosition = (item as PlacedBooster).location.Position;

				return eggPosition.sub(boosterPosition).Magnitude <= radius;
			}) as Array<PlacedBooster>;

			// 对结果进行排序以确保一致性，便于比较
			validBoosters.sort((a, b) => a.instanceId < b.instanceId);
			
			return validBoosters;
		}
	) as (state: SharedState) => Array<PlacedBooster>;
}

export function selectPlacedEggSizeBonus(
	playerId: string,
): (state: SharedState) => number | undefined {
	return createSelector(selectPlacedItems(playerId), (placedItems): number | undefined => {
		const egg = placedItems.find(item => item.itemType === ItemType.Egg);
		if (!egg) {
			return undefined;
		}

		const sizeBonus = egg.bonuses.find(bonus => bonus.type === BonusType.Size);
		if (!sizeBonus) {
			return undefined;
		}

		return sizeBonus.value;
	});
}

/**
 * 选择工具栏物品（背包的前九个物品）.
 *
 * @param playerId - 玩家ID.
 * @returns 工具栏物品选择器函数.
 */
export function selectToolBarItems(
	playerId: string,
): (state: SharedState) => Array<PlayerInventoryItem> {
	return createSelector(
		selectInventoryItems(playerId),
		(inventoryItems): Array<PlayerInventoryItem> => {
			// 获取背包的前九个物品作为工具栏物品
			const toolBarSize = 9;
			const toolBarItems: Array<PlayerInventoryItem> = [];

			for (let index = 0; index < math.min(inventoryItems.size(), toolBarSize); index++) {
				const item = inventoryItems[index];
				if (item) {
					toolBarItems.push(item);
				}
			}

			return toolBarItems;
		},
	);
}

/**
 * 选择背包中除了前九个之外的物品.
 *
 * @param playerId - 玩家ID.
 * @returns 背包中除前九个之外的物品选择器函数.
 */
export function selectInventoryExtraItems(
	playerId: string,
): (state: SharedState) => Array<PlayerInventoryItem> {
	return createSelector(
		selectInventoryItems(playerId),
		(inventoryItems): Array<PlayerInventoryItem> => {
			// 获取背包中除了前9个之外的物品
			const toolBarSize = 9;
			const extraItems: Array<PlayerInventoryItem> = [];

			for (let index = toolBarSize; index < inventoryItems.size(); index++) {
				const item = inventoryItems[index];
				if (item) {
					extraItems.push(item);
				}
			}

			return extraItems;
		},
	);
}

/**
 * 根据实例ID查找背包物品.
 *
 * @param playerId - 玩家ID.
 * @param itemInstanceId - 物品实例ID.
 * @returns 背包物品选择器函数.
 */
export function selectInventoryItemById(
	playerId: string,
	itemInstanceId: string,
): (state: SharedState) => PlayerInventoryItem | undefined {
	return createSelector(
		selectInventoryItems(playerId),
		(inventoryItems): PlayerInventoryItem | undefined => {
			return inventoryItems.find(item => {
				// 只有某些类型的物品有instanceId属性
				if ("instanceId" in item) {
					return item.instanceId === itemInstanceId;
				}

				return false;
			});
		},
	);
}

/**
 * 根据实例ID查找放置物品.
 *
 * @param playerId - 玩家ID.
 * @param itemInstanceId - 物品实例ID.
 * @returns 放置物品选择器函数.
 */
export function selectPlacedItemById(
	playerId: string,
	itemInstanceId: string,
): (state: SharedState) => PlayerPlacedItem | undefined {
	return createSelector(
		selectPlacedItems(playerId),
		(placedItems): PlayerPlacedItem | undefined => {
			return placedItems.find(item => {
				// 只有某些类型的物品有instanceId属性
				if ("instanceId" in item) {
					return item.instanceId === itemInstanceId;
				}

				return false;
			});
		},
	);
}

// ==================== 扩展相关选择器 ====================

/**
 * 选择玩家当前岛屿的扩展状态.
 *
 * @param playerId - 玩家ID.
 * @returns 扩展状态选择器函数.
 */
export function selectIslandExpansions(
	playerId: string,
): (state: SharedState) => Record<string, boolean> {
	return createSelector(
		selectCurrentIslandState(playerId),
		(islandState): Record<string, boolean> => islandState?.expands ?? {},
	);
}

/**
 * 检查特定扩展是否已解锁.
 *
 * @param playerId - 玩家ID.
 * @param expansionId - 扩展ID.
 * @returns 扩展解锁状态选择器函数.
 */
export function selectIsExpansionUnlocked(
	playerId: string,
	expansionId: string,
): (state: SharedState) => boolean {
	return createSelector(
		selectIslandExpansions(playerId),
		(expansions): boolean => expansions[expansionId] ?? false,
	);
}

/**
 * 选择已解锁的扩展列表.
 *
 * @param playerId - 玩家ID.
 * @returns 已解锁扩展列表选择器函数.
 */
export function selectUnlockedExpansions(playerId: string): (state: SharedState) => Array<string> {
	return createSelector(selectIslandExpansions(playerId), (expansions): Array<string> => {
		const unlockedExpansions: Array<string> = [];
		for (const [expansionId, isUnlocked] of pairs(expansions)) {
			if (isUnlocked) {
				unlockedExpansions.push(expansionId);
			}
		}

		return unlockedExpansions;
	});
}

// ==================== 传送带相关选择器 ====================

/**
 * 选择传送带速度模式.
 *
 * @param playerId - 玩家ID.
 * @returns 传送带速度模式选择器函数.
 */
export function selectConveyorSpeedMode(
	playerId: string,
): (state: SharedState) => ConveyorSpeedMode | undefined {
	return createSelector(
		selectPlayerConveyor(playerId),
		(conveyorState): ConveyorSpeedMode | undefined => conveyorState?.speedMode,
	);
}

/**
 * 选择传送带速度历史.
 *
 * @param playerId - 玩家ID.
 * @returns 传送带速度历史选择器函数.
 */
export function selectConveyorSpeedHistory(
	playerId: string,
): (state: SharedState) => Array<SpeedHistoryEntry> {
	return createSelector(
		selectPlayerConveyor(playerId),
		(conveyorState): Array<SpeedHistoryEntry> => conveyorState?.speedModeHistory ?? [],
	);
}

/**
 * 选择上次蛋生成时间.
 *
 * @param playerId - 玩家ID.
 * @returns 上次蛋生成时间选择器函数.
 */
export function selectLastEggGenerationTime(playerId: string): (state: SharedState) => number {
	return createSelector(
		selectPlayerConveyor(playerId),
		(conveyorState): number => conveyorState?.lastEggGenerationTime ?? 0,
	);
}

// ==================== 综合状态选择器 ====================

/**
 * 选择物品统计信息.
 *
 * @param playerId - 玩家ID.
 * @returns 物品统计信息选择器函数.
 */
export function selectItemStats(playerId: string): (state: SharedState) => {
	hasHeldItem: boolean;
	inventoryCount: number;
	placedCount: number;
	totalItems: number;
} {
	return createSelector(
		selectInventoryItems(playerId),
		selectPlacedItems(playerId),
		selectHeldItem(playerId),
		(inventoryItems, placedItems, heldItem) => {
			return {
				hasHeldItem: heldItem !== undefined,
				inventoryCount: inventoryItems.size(),
				placedCount: placedItems.size(),
				totalItems:
					inventoryItems.size() + placedItems.size() + (heldItem !== undefined ? 1 : 0),
			};
		},
	);
}

/**
 * 选择玩家完整数据（类似persistent的selectPlayerData）.
 *
 * @param playerId - 玩家ID.
 * @returns 玩家完整数据选择器函数.
 */
export function selectPlayerData(playerId: string): (state: SharedState) =>
	| undefined
	| {
			conveyor: PlayerConveyorState;
			currentIslandState: IslandState | undefined;
			eggStats: {
				conveyorCount: number;
				lastGenerationTime: number;
				missedCount: number;
				totalGenerated: number;
			};
			islands: PlayerIslandState;
			itemStats: {
				hasHeldItem: boolean;
				inventoryCount: number;
				placedCount: number;
				totalItems: number;
			};
			plot: PlayerPlotState;
	  } {
	return createSelector(
		selectPlayerState(playerId),
		selectCurrentIslandState(playerId),
		selectEggStats(playerId),
		selectItemStats(playerId),
		(playerState, currentIslandState, eggStats, itemStats) => {
			if (!playerState) {
				return;
			}

			return {
				conveyor: playerState.conveyor,
				currentIslandState,
				eggStats,
				islands: playerState.islands,
				itemStats,
				plot: playerState.plot,
			};
		},
	);
}
