/**
 * 物品配置定义文件.
 */

/** 物品图标配置 */
interface ItemIcons {
	/** 普通图标 */
	Normal: string;
	
	/** 金色图标 */
	Golden: string;
	
	/** 钻石图标 */
	Diamond: string;
}

/** 单个物品的配置 */
interface ItemConfig {
	/** 基础金钱收益 */
	money_base: number;
	
	/** 物品尺寸类型 */
	size: "Default" | "BigGuys" | string;
	
	/** 物品名称 */
	name: string;
	
	/** 物品图标配置 */
	icons: ItemIcons;
	
	/** 刷新时间（秒） */
	ft: number;
	
	/** 收益百分比 */
	percent: number;
	
	/** 物品3D模型 */
	model: Model;
	
	/** 排序顺序 */
	order: number;
	
	/** 所属岛屿 */
	belongsTo: string;
}

/** 物品工具函数接口 */
interface ItemUtils {
	/** 设置物品图标 */
	SetIcon: (imageLabel: ImageLabel, itemConfig: ItemConfig, mutations?: string[], useFrame?: boolean) => void;
	
	/** 获取物品模型 */
	GetModel: (itemId: string, mutations?: string[]) => Model | undefined;
}

/** 所有物品的配置映射 */
interface ItemsConfig extends ItemUtils {
	/** 物品配置 */
	[itemId: string]: ItemConfig | Function;
	
	/** 常见物品 */
	Item1: ItemConfig;
	Item2: ItemConfig;
	Item3: ItemConfig;
	Item4: ItemConfig;
	Item5: ItemConfig;
	Item6: ItemConfig;
	Item7: ItemConfig;
	Item8: ItemConfig;
	Item9: ItemConfig;
	Item10: ItemConfig;
	Item11: ItemConfig;
	Item12: ItemConfig;
	Item13: ItemConfig;
}

/** 导出物品配置 */
declare const ItemsConfig: ItemsConfig;

export = ItemsConfig;
