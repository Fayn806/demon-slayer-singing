/**
 * 扩展配置定义文件.
 */

/** 扩展区域配置映射 */
interface ExpandConfig {
	/** 扩展区域价格映射 (位置ID -> 价格) */
	[positionId: string]: number;
	
	/** 常见扩展区域 */
	"1_3": number;
	"2_3": number;
	"3_3": number;
	"4_3": number;
	"5_3": number;
	"6_3": number;
	"7_3": number;
	
	"1_4": number;
	"2_4": number;
	"3_4": number;
	"4_4": number;
	"5_4": number;
	"6_4": number;
	"7_4": number;
	
	"1_5": number;
	"2_5": number;
	"3_5": number;
	"4_5": number;
	"5_5": number;
	"6_5": number;
	"7_5": number;
	
	"1_6": number;
	"2_6": number;
	"3_6": number;
	"4_6": number;
	"5_6": number;
	"6_6": number;
	"7_6": number;
}

/** 导出扩展配置 */
declare const ExpandConfig: ExpandConfig;

export = ExpandConfig;
