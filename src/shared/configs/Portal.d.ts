/**
 * 传送门配置定义文件.
 */

/** 传送门配置 */
interface PortalConfig {
	/** 描述模板（包含占位符） */
	desc: string;
	
	/** 需要孵化的蛋数量 */
	amount: number;
}

/** 导出传送门配置 */
declare const PortalConfig: PortalConfig;

export = PortalConfig;
