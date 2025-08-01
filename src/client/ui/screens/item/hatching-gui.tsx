import React from "@rbxts/react";

import { HatchingStats } from "./components/hatching-stats";
import { RootProvider } from "client/ui/providers/root-provider";

interface HatchingGuiProps {
	instanceId: string;
}

export function HatchingGui({ instanceId }: HatchingGuiProps): React.ReactNode {
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
				<HatchingStats instanceId={instanceId} />
			</billboardgui>
		</RootProvider>
	);
}
