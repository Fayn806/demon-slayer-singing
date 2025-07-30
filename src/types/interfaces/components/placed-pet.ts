/** 蛋组件的属性接口. */
export interface PlacedPetAttributes {
	/** 物品实例ID. */
	instanceId: string;
	/** 玩家ID. */
	playerId: string;
}

/** 蛋模型接口. */
export interface PlacedPetModel extends Model {
	/** 主要部件. */
	PrimaryPart: Part;
}
