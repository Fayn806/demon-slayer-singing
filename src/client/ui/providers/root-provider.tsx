import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";

import { store } from "client/store";

import type { RemProviderProps } from "./rem-provider";
import { RemProvider } from "./rem-provider";
import { ThemeProvider } from "./theme-provider";

export function RootProvider({
	baseRem,
	remOverride,
	children,
}: RemProviderProps): React.ReactNode {
	return (
		<ReflexProvider key="reflex-provider" producer={store}>
			<ThemeProvider key="theme-provider">
				<RemProvider key="rem-provider" baseRem={baseRem} remOverride={remOverride}>
					{children}
				</RemProvider>
			</ThemeProvider>
		</ReflexProvider>
	);
}
