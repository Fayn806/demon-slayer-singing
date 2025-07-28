// ==================== 基础类型定义 ====================

/** 物品类型枚举. */
export enum ItemType {
	Booster = "booster",
	Decoration = "decoration",
	Egg = "egg",
	// 锤子
	Hammer = "hammer",
	HatchedPet = "hatched_pet",
}

/** 基础物品属性. */
export interface BaseItemData {
	/** 物品实例ID. */
	instanceId: string;
	/** 物品类型. */
	itemType: ItemType;
	/** 放置需要的范围. */
	placeRange: number;
}

/** 放置数据接口. */
export interface PlacedData {
	/** 岛屿ID. */
	islandId: string;
	/** 放置位置. */
	location: CFrame;
	/** 放置时间戳. */
	placedTime: number;
}

// ==================== 蛋类系统 ====================

/** 蛋类型定义. */
export type EggId = "Egg1" | "Egg2" | "Egg3" | "Egg4" | "Egg5" | "Egg6" | "Egg7" | "Egg8";

/** 蛋稀有度枚举. */
export enum EggRarity {
	Common = 1,
	Uncommon = 2,
	Rare = 3,
	Epic = 4,
	Legendary = 5,
	Mythic = 6,
	Divine = 7,
	Celestial = 8,
}

/** 蛋变异类型枚举. */
export enum EggMutation {
	Golden = "Golden",
	Normal = "Normal",
	Rainbow = "Rainbow",
	Shiny = "Shiny",
}

/** 蛋的状态枚举. */
export enum EggStatus {
	Hatched = "hatched",
	Hatching = "hatching",
	Unhatched = "unhatched",
}

/** 蛋的基础配置信息. */
export interface EggConfig {
	/** 孵化时间（秒）. */
	hatchTime: number;
	/** 图标路径. */
	icon: string;
	/** 蛋的唯一标识符. */
	id: EggId;
	/** 幸运值. */
	luck: number;
	/** 3D模型路径. */
	model?: string;
	/** 蛋的名称. */
	name: string;
	/** 蛋的价格. */
	price: number;
	/** 稀有度. */
	rarity: EggRarity;
	/** 解锁要求. */
	unlockRequirement?: {
		achievement?: string;
		level?: number;
		previousEgg?: EggId;
	};
}

/** 蛋实例基础接口. */
export interface EggInstance extends BaseItemData {
	/** 蛋类型. */
	eggId: EggId;
	/** 幸运加成. */
	luckBonus?: number;
	/** 变异类型. */
	mutations: Array<EggMutation>;
	/** 大小幸运加成. */
	sizeLuckBonus?: number;
	/** 生成时间. */
	spawnTime: number;
}

/** 玩家的蛋实例. */
export interface PlayerEgg extends EggInstance {
	/** 孵化剩余时间（秒）. */
	hatchLeftTime: number;
	/** 获得时间. */
	obtainTime: number;
	/** 蛋的状态. */
	status: EggStatus;
}

/** 传送带上的蛋. */
export interface ConveyorEgg extends EggInstance {
	/** 折扣价格（如果有活动）. */
	discountedPrice?: number;
	/** 移动开始时间. */
	moveStartTime: number;
}

/** 错过的蛋. */
export interface MissedEgg extends ConveyorEgg {
	/** 过期时间. */
	expireTime: number;
	/** 是否已过期. */
	isExpired: boolean;
	/** 进入保留区时间. */
	reserveTime: number;
}

// ==================== 宠物系统 ====================

/** 玩家的蛋孵化后宠物实例. */
export interface PlayerPet extends EggInstance {
	/** 孵化时间. */
	hatchTime: number;
	/** 宠物ID. */
	petId: string;
	/** 总收益. */
	totalEarnings: number;
}

// ==================== 加成道具系统 ====================

/** 加成道具类型枚举. */
export enum BoosterType {
	Capacity = "capacity",
	Coin = "coin",
	HatchSpeed = "hatch_speed",
	Luck = "luck",
	Speed = "speed",
}

/** 玩家的加成道具. */
export interface PlayerBooster extends BaseItemData {
	/** 加成类型. */
	boosterType: BoosterType;
	/** 剩余耐久度. */
	durability?: number;
	/** 是否激活. */
	isActive: boolean;
	/** 最大耐久度. */
	maxDurability?: number;
	/** 加成倍率. */
	multiplier: number;
	/** 影响范围 (格子数). */
	range: number;
}

// ==================== 已放置物品系统 ====================

/** 玩家放置的蛋. */
export interface PlayerPlacedEgg extends PlayerEgg {
	/** 放置数据. */
	placedData: PlacedData;
}

/** 玩家放置的宠物. */
export interface PlayerPlacedPet extends PlayerPet {
	/** 已领取收益. */
	claimedEarnings: number;
	/** 当前收益. */
	currentEarnings: number;
	/** 收益类型. */
	earningsType: "coins" | "gems";
	/** 放置数据. */
	placedData: PlacedData;
}

/** 玩家放置的加成道具. */
export interface PlayerPlacedBooster extends PlayerBooster {
	/** 放置数据. */
	placedData: PlacedData;
}

// ==================== 联合类型定义 ====================

/** 玩家放置的物品联合类型. */
export type PlayerPlacedItem = PlayerPlacedBooster | PlayerPlacedEgg | PlayerPlacedPet;

/** 玩家背包物品联合类型. */
export type PlayerInventoryItem = BaseItemData | PlayerBooster | PlayerEgg | PlayerPet;

/** 传送带配置接口. */
export interface ConveyorConfig {
	/** 传送带长度（studs）. */
	length: number;
	/** 传送带移动时间（秒），受速度影响. */
	moveTime: number;
	/** 当前速度倍数. */
	speedMultiplier: number;
}
