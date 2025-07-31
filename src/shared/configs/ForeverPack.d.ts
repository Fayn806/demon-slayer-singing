/**
 * 永久包配置定义文件.
 */

/** 永久包配置 */
interface ForeverPackConfig {
	/** 重置间隔时间（秒） */
	Reset: number;
}

/** 导出永久包配置 */
declare const ForeverPackConfig: ForeverPackConfig;

export = ForeverPackConfig;
