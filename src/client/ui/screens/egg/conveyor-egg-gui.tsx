import React from "@rbxts/react";

import { RootProvider } from "client/ui/providers/root-provider";
import type { EggMutation, EggRarity } from "shared/types";

import { ConveyorEggHeader } from "./components/conveyor-egg-header";

export function ConveyorEggGui({
	cost,
	eggName,
	mutations,
	rarity,
}: {
	cost: number;
	eggName: string;
	mutations: Array<EggMutation>;
	rarity: EggRarity;
}): React.ReactNode {
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
				<ConveyorEggHeader
					cost={cost}
					eggName={eggName}
					mutations={mutations}
					rarity={rarity}
				/>
			</billboardgui>
		</RootProvider>
	);
}
