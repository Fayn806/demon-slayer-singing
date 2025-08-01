/** 音箱配置定义文件. */

/** 音箱配置 */
interface BoomboxConfig {
	/** 音箱名称 */
	name: string;

	/** 音箱图标资源ID */
	icon: string;

	/** 音箱描述 */
	desc?: string;

	/** 音箱副描述 */
	subdesc?: string;

	/** 音箱3D模型 */
	model: Model;

	/** 音箱购买价格 */
	cost?: number;

	/** 每秒增益 */
	perSecond?: number;

	/** 作用范围半径 */
	radius: number;

	/** 持续时间（秒） */
	duration?: number;

	/** 最大增益倍数 */
	maxBoost?: number;

	/** 音箱类型 */
	type: "Diamond" | "Golden" | "Luck" | "Luck Size" | "Size" | "Size Luck";

	/** 显示顺序 */
	order: number;

	/** 是否立即生效 */
	INSTANT?: boolean;
}

/** 导出音箱配置字典 */
interface BoomboxesConfig {
	Boombox1: BoomboxConfig;
	Boombox2: BoomboxConfig;
	Boombox3: BoomboxConfig;
	Boombox4: BoomboxConfig;
	DiamondBoombox: BoomboxConfig;
	GoldenBoombox: BoomboxConfig;

	/** 允许通过字符串索引访问 */
	[boomboxId: string]: BoomboxConfig;
}

declare const BoomboxesConfig: BoomboxesConfig;

export = BoomboxesConfig;
