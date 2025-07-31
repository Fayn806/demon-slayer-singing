/**
 * 全局事件配置定义文件.
 */

/** 事件权重配置 */
interface EventWeightConfig {
	/** 事件权重 */
	Weight: number;
}

/** 事件详情配置 */
interface EventDetailsConfig {
	/** 事件名称 */
	name: string;
	
	/** 事件描述 */
	desc: string;
	
	/** 延迟时间（可选） */
	delay?: number;
}

/** 全局事件配置 */
interface GlobalEventsConfig {
	/** 事件持续时间列表（秒） */
	Durations: number[];
	
	/** 事件权重配置 */
	Weights: {
		readonly GoldRush: EventWeightConfig;
		readonly FireSale: EventWeightConfig;
		readonly LightningStorm: EventWeightConfig;
		readonly SolarFlare: EventWeightConfig;
	};
	
	/** 金币狂潮事件 */
	GoldRush: EventDetailsConfig;
	
	/** 火热销售事件 */
	FireSale: EventDetailsConfig;
	
	/** 闪电风暴事件 */
	LightningStorm: EventDetailsConfig;
	
	/** 太阳耀斑事件 */
	SolarFlare: EventDetailsConfig;
	
	/** 冰雪风暴事件 */
	IceyStorm: EventDetailsConfig;
	
	/** 故障事件 */
	Glitch: EventDetailsConfig;
}

/** 导出全局事件配置 */
declare const GlobalEventsConfig: GlobalEventsConfig;

export = GlobalEventsConfig;
