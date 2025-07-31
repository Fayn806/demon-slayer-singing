/**
 * 药水配置定义文件.
 */

/** 药水配置 */
interface PotionConfig {
	/** 药水名称 */
	name: string;
	
	/** 药水描述 */
	desc: string;
	
	/** 药水图标资源ID */
	icon: string;
	
	/** 高亮颜色 */
	highlightColor: Color3;
	
	/** 药水类型 */
	type: "Luck" | "Time" | "Mutation";
	
	/** 显示顺序 */
	order: number;
	
	/** 幸运值（幸运类型药水） */
	luck?: number;
	
	/** 时间减少（秒，时间类型药水） */
	time_?: number;
}

/** 导出药水配置字典 */
declare const PotionConfig: {
	readonly "Hatch Luck": PotionConfig;
	readonly "5m Hatch Time": PotionConfig;
	readonly "15m Hatch Time": PotionConfig;
	readonly "45m Hatch Time": PotionConfig;
	readonly "Golden": PotionConfig;
	readonly "Diamond": PotionConfig;
};

export = PotionConfig;
