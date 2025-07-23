import { useContext } from "@rbxts/react";

import type { Theme } from "../contexts/theme";
import { ThemeContext } from "../contexts/theme";

export function useTheme(): Theme {
	const { theme } = useContext(ThemeContext);

	return theme;
}
