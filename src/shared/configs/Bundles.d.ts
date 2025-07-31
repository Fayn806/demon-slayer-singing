/** 捆绑包配置定义文件. */

/** 捆绑包中的蛋配置 */
type BundleEggConfig = Record<number, [string]>;

/** 捆绑包配置 */
interface BundleConfig {
	/** 蛋配置 */
	Eggs: Record<string, BundleEggConfig>;

	/** 金钱奖励 */
	Money: number;
}

/** 导出捆绑包配置字典 */
declare const BundleConfig: {
	readonly Starter: BundleConfig;
};

export = BundleConfig;
