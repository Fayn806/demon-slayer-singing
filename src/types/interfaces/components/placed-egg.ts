import type { ConveyorEgg } from "shared/types";

/** 蛋组件的属性接口. */
export interface PlacedEggAttributes {
	/** 物品实例ID. */
	instanceId: string;
	/** 玩家ID. */
	playerId: string;
}

/** 蛋模型接口. */
export interface PlacedEggModel extends Model {
	/** 广告牌 GUI. */
	Billboard: BillboardGui;
	/** 蛋的网格部件. */
	Egg: MeshPart;
	/** 主要部件. */
	PrimaryPart: Part;
}

/** 蛋数据类型. */
export type EggData = ConveyorEgg;
