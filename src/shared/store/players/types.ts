import type { ConveyorEgg, MissedEgg, PlayerInventoryItem, PlayerPlacedItem } from "shared/types";

export interface IslandState {
	eggs: {
		conveyor: Array<ConveyorEgg>;
		missed: Array<MissedEgg>;
	};
	expands: Record<string, boolean>;
	/** 玩家手持物品实例ID. */
	heldItemInstanceId?: string;
	/** 玩家背包物品. */
	inventory: Array<PlayerInventoryItem>;
	placed: Array<PlayerPlacedItem>;
}

export type PlayerIslandState = Record<string, IslandState>;

export interface PlayerPlotState {
	/** 玩家位置编号. */
	index: number;
	/** 玩家岛屿ID. */
	islandId: string;
	/** 玩家Id. */
	playerId: string;
}

export enum ConveyorSpeedMode {
	Slow = 1,
	Normal = 2,
	Fast = 3,
}

/** 速度历史记录接口. */
export interface SpeedHistoryEntry {
	speedMode: ConveyorSpeedMode;
	time: number;
}

export interface PlayerConveyorState {
	lastEggGenerationTime: number;
	speedMode: ConveyorSpeedMode;
	speedModeHistory: Array<SpeedHistoryEntry>;
}

export interface PlayerState {
	/** 玩家传送带状态. */
	conveyor: PlayerConveyorState;
	/** 玩家岛屿数据. */
	islands: PlayerIslandState;
	/** 玩家地块信息. */
	plot: PlayerPlotState;
}

export type PlayersState = Readonly<Record<string, PlayerState | undefined>>;
