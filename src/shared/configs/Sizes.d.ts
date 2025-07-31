/**
 * 尺寸配置定义文件.
 */

/** 尺寸配置项 */
interface SizeConfig {
	/** 尺寸名称 */
	Name: string;
	
	/** 权重值 */
	Weight: number;
	
	/** 倍数范围 [最小值, 最大值] */
	MultRange: [number, number];
	
	/** 缩放范围 [最小值, 最大值] */
	ScaleRange: [number, number];
}

/** 所有尺寸的配置映射 */
interface SizesConfig {
	/** 默认尺寸配置 */
	Default: SizeConfig[];
	
	/** 大型物品尺寸配置 */
	BigGuys: SizeConfig[];
	
	/** 允许通过字符串索引访问 */
	[sizeCategory: string]: SizeConfig[];
}

/** 导出尺寸配置 */
declare const SizesConfig: SizesConfig;

export = SizesConfig;
