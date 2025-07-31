/**
 * 变异配置定义文件.
 */

/** 变异权重配置 */
interface MutationWeightConfig {
	/** 变异名称 */
	Name: string;
	
	/** 权重值 */
	Weight: number;
}

/** 单个变异的配置 */
interface MutationConfig {
	/** 倍数 */
	multi: number;
	
	/** 成本 */
	cost: number;
	
	/** 是否可叠加 */
	stack?: boolean;
}

/** 变异工具函数接口 */
interface MutationUtils {
	/** 权重配置 */
	Weight: MutationWeightConfig[];
	
	/** 获取模型类型 */
	GetModel: (mutations: string[]) => string;
}

/** 所有变异的配置映射 */
interface MutationsConfig extends MutationUtils {
	/** 普通变异 */
	Normal: MutationConfig;
	
	/** 金色变异 */
	Golden: MutationConfig;
	
	/** 钻石变异 */
	Diamond: MutationConfig;
	
	/** 火焰变异 */
	Fire: MutationConfig;
	
	/** 电力变异 */
	Electric: MutationConfig;
	
	/** 故障变异 */
	Glitch: MutationConfig;
	
	/** 冰霜变异 */
	Ice: MutationConfig;
	
	/** 允许通过字符串索引访问 */
	[mutationName: string]: MutationConfig | MutationWeightConfig[] | Function;
}

/** 导出变异配置 */
declare const MutationsConfig: MutationsConfig;

export = MutationsConfig;
