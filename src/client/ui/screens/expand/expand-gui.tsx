import React from "@rbxts/react";

import { RootProvider } from "client/ui/providers/root-provider";

import { ExpandInfo } from "./components/expand-info";

export function ExpandGui({
	price,
	selected,
}: {
	price: number;
	selected: boolean;
}): React.ReactNode {
	return (
		<RootProvider>
			<billboardgui
				AlwaysOnTop={true}
				ClipsDescendants={false}
				MaxDistance={125}
				ResetOnSpawn={false}
				Size={new UDim2(15, 0, 3, 0)}
				StudsOffsetWorldSpace={new Vector3(0, 2.8, 0)}
			>
				<ExpandInfo price={price} selected={selected} />
			</billboardgui>
		</RootProvider>
	);
}
