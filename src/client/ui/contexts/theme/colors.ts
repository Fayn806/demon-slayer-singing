/** 主题配色方案接口. */
export interface ThemeColors {
	/** 强调色（按钮、重点元素）. */
	accent: Color3;
	/** 背景色. */
	background: Color3;
	/** 错误色. */
	error: Color3;
	/** 主要背景色（卡片、面板等）. */
	primary: Color3;
	/** 次要背景色. */
	secondary: Color3;
	/** 成功色. */
	success: Color3;
	/** 表面色（用于卡片、面板等）. */
	surface: Color3;
	/** 文本色. */
	text: Color3;
	/** 次要文本色. */
	textSecondary: Color3;
	/** 次要文本色. */
	textTertiary: Color3;
	/** 警告色. */
	warning: Color3;
}
