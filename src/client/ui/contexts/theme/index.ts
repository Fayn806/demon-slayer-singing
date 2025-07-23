import { createContext } from "@rbxts/react";

import type { ThemeColors } from "./colors";
import type { ThemeFonts } from "./fonts";
import type { ThemeSizes } from "./sizes";

/** 完整主题接口. */
export interface Theme {
	colors: ThemeColors;
	fonts: ThemeFonts;
	name: string;
	sizes: ThemeSizes;
}

/** 主题上下文接口. */
export interface ThemeContextType {
	theme: Theme;
}

/** 默认主题. */
export const defaultTheme: Theme = {
	name: "默认主题",
	colors: {
		accent: new Color3(0.4, 0.3, 0.8),
		background: new Color3(0.06, 0.06, 0.08),
		error: new Color3(0.8, 0.2, 0.2),
		primary: new Color3(0.1, 0.1, 0.15),
		secondary: new Color3(0.15, 0.15, 0.2),
		success: new Color3(0.2, 0.8, 0.2),
		surface: new Color3(0.12, 0.12, 0.17),
		text: new Color3(1, 1, 1),
		textSecondary: new Color3(0.7, 0.7, 0.7),
		textTertiary: new Color3(0.5, 0.5, 0.5),
		warning: new Color3(1, 0.7, 0.1),
	},
	fonts: {
		body: Enum.Font.Oswald,
		button: Enum.Font.Oswald,
		title: Enum.Font.Oswald,
	},
	sizes: {
		cornerRadius: {
			large: 0.2,
			medium: 0.1,
			small: 0.05,
		},
		spacing: {
			large: 16,
			medium: 8,
			small: 4,
		},
		textSizes: {
			button: 16,
			large: 24,
			medium: 16,
			small: 12,
			text: 16,
			textSecondary: 14,
			textTertiary: 12,
			title: 24,
		},
	},
};

/** 创建主题上下文，使用默认主题. */
export const ThemeContext = createContext<ThemeContextType>({
	theme: defaultTheme,
});
