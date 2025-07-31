/**
 * 蛋类配置定义文件.
 */

/** 物品掉落概率配置 */
interface EggRollConfig {
	/** 物品ID到掉落概率的映射 */
	[itemId: string]: number;
}

/** 单个蛋的配置 */
interface EggConfig {
	/** 蛋的名称 */
	name: string;
	
	/** 蛋的图标资源ID */
	icon: string;
	
	/** 幸运倍数显示文本 */
	luck: string;
	
	/** 掉落物品配置 */
	roll: EggRollConfig;
	
	/** 蛋的3D模型 */
	model: Model;
	
	/** 孵化时间（秒） */
	hatchTime: number;
	
	/** 购买成本 */
	cost: number;
	
	/** 排序顺序 */
	order: number;
}

/** 所有蛋的配置映射 */
interface EggsConfig {
	/** 基础蛋 */
	Egg1: EggConfig;
	
	/** 稀有蛋 */
	Egg2: EggConfig;
	
	/** 史诗蛋 */
	Egg3: EggConfig;
	
	/** 碎片蛋 */
	Egg4: EggConfig;
	
	/** 火焰蛋 */
	Egg5: EggConfig;
	
	/** 像素蛋 */
	Egg6: EggConfig;
	
	/** 天使蛋 */
	Egg7: EggConfig;
	
	/** 尖刺蛋 */
	Egg8: EggConfig;
	
	/** 允许通过字符串索引访问 */
	[eggId: string]: EggConfig;
}

/** 导出蛋类配置 */
declare const EggsConfig: EggsConfig;

export = EggsConfig;
