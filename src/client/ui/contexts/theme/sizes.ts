/** 主题尺寸设置接口. */
export interface ThemeSizes {
	/** 圆角尺寸. */
	cornerRadius: {
		large: number;
		medium: number;
		small: number;
	};
	/** 间距. */
	spacing: {
		large: number;
		medium: number;
		small: number;
	};
	/** 文本大小. */
	textSizes: {
		button: number;
		large: number;
		medium: number;
		small: number;
		text: number;
		textSecondary: number;
		textTertiary: number;
		title: number;
	};
}
