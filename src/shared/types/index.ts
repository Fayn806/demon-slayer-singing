// ==================== 基础类型定义 ====================

/** 物品类型枚举. */
export enum ItemType {
	Booster = "booster",
	Decoration = "decoration",
	Egg = "egg",
	// 锤子
	Hammer = "hammer",
	HatchedPet = "hatched_pet",
	Pet = "pet",
}

/** 放置数据接口. */
export interface PlacedData {
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
	Diamond = "diamond",
	Golden = "golden",
	Normal = "normal",
	Rainbow = "rainbow",
	Shiny = "shiny",
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

export interface BaseEgg {
	/** 蛋的唯一标识符. */
	eggId: EggId;
	/** 蛋的类型. */
	mutations: Array<EggMutation>;
}

export interface ConveyorEgg extends BaseEgg {
	/** 折扣价格（如果有活动）. */
	discountedPrice?: number;
	/** 实例ID. */
	instanceId: string;
	/** 物品类型. */
	itemType: ItemType.Egg;
	/** 移动开始时间戳. */
	moveStartTime: number;
	/** 生成时间戳. */
	spawnTime: number;
}

export interface MissedEgg extends ConveyorEgg {
	/** 过期时间戳. */
	expireTime: number;
	/** 是否已过期. */
	isExpired: boolean;
	/** 进入保留区时间戳. */
	reserveTime: number;
}

export interface PlayerEgg extends BaseEgg {
	/** 数量. */
	count: number;
	/** 实例ID. */
	instanceId: string;
	/** 物品类型. */
	itemType: ItemType.Egg;
}

export interface PlacedEgg extends BaseEgg, PlacedData {
	/** 孵化剩余时间（秒）. */
	hatchLeftTime: number;
	/** 实例ID. */
	instanceId: string;
	/** 物品类型. */
	itemType: ItemType.Egg;
	/** 幸运加成. */
	luckBonus: number;
	/** 大小加成. */
	sizeBonus: number;
}

/** 玩家的蛋孵化后宠物实例. */
export interface PlayerPet {
	/** 蛋的唯一标识符. */
	eggId: EggId;
	/** 孵化时间. */
	hatchTime: number;
	/** 宠物ID. */
	instanceId: string;
	/** 物品类型. */
	itemType: ItemType.Pet;
	/** 幸运加成. */
	luckBonus?: number;
	/** 变异类型. */
	mutations: Array<EggMutation>;
	/** 宠物ID. */
	petId: string;
	/** 大小加成. */
	sizeBonus?: number;
	/** 总收益. */
	totalEarnings: number;
}

export interface PlacedPet extends PlacedData, PlayerPet {
	/** 当前放置累计收益. */
	currentEarning: number;
	/** 收益类型. */
	earningsType: "coins" | "gems";
	/** 收益时间. */
	earningTime: number;
}

/** 加成道具类型枚举. */
export enum BoosterType {
	Capacity = "capacity",
	Coin = "coin",
	HatchSpeed = "hatch_speed",
	Luck = "luck",
	Speed = "speed",
}

/** 玩家的加成道具. */
export interface PlayerBooster {
	/** 物品id. */
	boosterId: string;
	/** 道具ID. */
	instanceId: string;
	/** 物品类型. */
	itemType: ItemType.Booster;
}

/** 玩家放置的加成道具. */
export interface PlacedBooster extends PlacedData, PlayerBooster {
	/** 物品类型. */
	itemType: ItemType.Booster;
	/** 当前加成剩余时间（秒）. */
	remainingTime: number;
}

export interface PlayerHammer {
	/** 锤子ID. */
	hammerId: string;
	/** 实例ID. */
	instanceId: string;
	/** 物品类型. */
	itemType: ItemType.Hammer;
	/** 锤子使用次数. */
	uses: number;
}

// ==================== 联合类型定义 ====================

/** 玩家放置的物品联合类型. */
export type PlayerPlacedItem = PlacedBooster | PlacedEgg | PlacedPet;

/** 玩家背包物品联合类型. */
export type PlayerInventoryItem = PlayerBooster | PlayerEgg | PlayerHammer | PlayerPet;

/** 传送带配置接口. */
export interface ConveyorConfig {
	/** 传送带长度（studs）. */
	length: number;
	/** 传送带移动时间（秒），受速度影响. */
	moveTime: number;
	/** 当前速度倍数. */
	speedMultiplier: number;
}
