/**
 * 锤子配置定义文件.
 */

/** 锤子配置 */
interface HammerConfig {
	/** 锤子名称 */
	name: string;
	
	/** 锤子图标资源ID */
	icon: string;
}

/** 导出锤子配置 */
declare const HammerConfig: HammerConfig;

export = HammerConfig;
