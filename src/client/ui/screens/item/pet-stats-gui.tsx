import React from "@rbxts/react";

import { RootProvider } from "client/ui/providers/root-provider";

import { PetStats } from "./components/pet-stats";

export function PetStatsGui({ instanceId }: { instanceId: string }): React.ReactNode {
	return (
		<RootProvider>
			<billboardgui
				AlwaysOnTop={true}
				ClipsDescendants={false}
				MaxDistance={125}
				ResetOnSpawn={false}
				Size={new UDim2(5, 0, 3, 0)}
				StudsOffsetWorldSpace={new Vector3(0, 3.7, 0)}
			>
				<PetStats instanceId={instanceId} />
			</billboardgui>
		</RootProvider>
	);
}
