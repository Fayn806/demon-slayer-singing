/**
 * 岛屿配置定义文件.
 */

/** 传送带蛋配置 */
interface ConveyorEggConfig {
	/** 蛋的名称 */
	Name: string;
	
	/** 权重值 */
	Weight: number;
}

/** 作曲配置 */
interface ComposingConfig {
	/** 是否启用全局事件 */
	GLOBAL_EVENTS: boolean;
	
	/** 是否可收集 */
	COLLECT: boolean;
	
	/** 每分钟节拍数 */
	BPM: number;
	
	/** 节拍数 */
	Beats: number;
	
	/** 节拍持续时间 */
	BeatDuration: number;
	
	/** 网格大小 */
	GridSize: number;
	
	/** X轴大小 */
	X: number;
	
	/** Y轴大小 */
	Y: number;
}

/** 单个岛屿的配置 */
interface IslandConfig {
	/** 是否启用全局事件 */
	GLOBAL_EVENTS: boolean;
	
	/** 是否可收集 */
	COLLECT: boolean;
	
	/** 传送带蛋配置列表 */
	Conveyor: ConveyorEggConfig[];
	
	/** 作曲配置 */
	Composing?: ComposingConfig;
}

/** 所有岛屿的配置映射 */
interface IslandsConfig {
	/** 岛屿1 */
	Island1: IslandConfig;
	
	/** 允许通过字符串索引访问 */
	[islandId: string]: IslandConfig;
}

/** 导出岛屿配置 */
declare const IslandsConfig: IslandsConfig;

export = IslandsConfig;
