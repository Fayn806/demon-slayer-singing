import React, { useEffect, useMemo, useState } from "@rbxts/react";
import { Workspace } from "@rbxts/services";

import type { Theme } from "../contexts/theme";
import { defaultTheme, ThemeContext } from "../contexts/theme";

type ThemeProviderProps = React.PropsWithChildren;

function getScreenSize(): Vector2 {
	return Workspace.CurrentCamera?.ViewportSize ?? new Vector2(1920, 1080);
}

function getAdjustedTheme(): Theme {
	// 创建主题副本以避免修改原始对象
	const adjustedTheme = table.clone(defaultTheme);
	adjustedTheme.sizes = table.clone(defaultTheme.sizes);

	return adjustedTheme;
}

/**
 * 主题提供者组件 在应用程序的根部使用此组件，以便所有子组件都能访问主题 会根据屏幕尺寸自动调整分割线大小.
 *
 * @example <ThemeProvider> <App /> </ThemeProvider>
 *
 * @param children
 *
 *   - 子组件.
 *
 * @returns 返回一个 React 节点.
 */
export function ThemeProvider({ children }: ThemeProviderProps): React.ReactNode {
	// 状态用于存储调整后的主题
	const [theme, setTheme] = useState<Theme>(getAdjustedTheme);

	// 监听屏幕尺寸变化
	useEffect(() => {
		// 设置窗口大小变化时的检测
		/** 每秒检测一次. */
		const screenSizeCheckInterval = 1;
		let lastScreenSize = getScreenSize();

		// 定期检查屏幕尺寸变化
		const connection = game.GetService("RunService").Heartbeat.Connect(() => {
			// 计时器
			task.wait(screenSizeCheckInterval);

			// 获取当前屏幕尺寸
			const currentScreenSize = getScreenSize();

			// 如果屏幕尺寸有变化
			if (
				currentScreenSize.X !== lastScreenSize.X ||
				currentScreenSize.Y !== lastScreenSize.Y
			) {
				lastScreenSize = currentScreenSize;
				// 更新主题
				setTheme(getAdjustedTheme());
			}
		});

		/** 清理函数. */
		return () => {
			connection.Disconnect();
		};
	}, []);

	// 创建上下文值
	const contextValue = useMemo(() => ({ theme }), [theme]);

	return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}
