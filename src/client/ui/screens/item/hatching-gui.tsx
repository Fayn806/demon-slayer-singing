import React from "@rbxts/react";

import { EggType } from "shared/types";

import { HatchingTime } from "./components/hatching-time";

interface HatchingGuiProps {
	eggType?: EggType;
	leftTime: number;
	maxTime: number;
}

export function HatchingGui({ eggType, leftTime, maxTime }: HatchingGuiProps): React.ReactNode {
	return (
		<billboardgui
			AlwaysOnTop={true}
			ClipsDescendants={false}
			MaxDistance={125}
			ResetOnSpawn={false}
			Size={new UDim2(5, 0, 3, 0)}
			StudsOffsetWorldSpace={new Vector3(0, 3.7, 0)}
		>
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				Padding={new UDim(0, 0.03)}
				SortOrder={Enum.SortOrder.LayoutOrder}
				VerticalAlignment={Enum.VerticalAlignment.Center}
			/>
			<HatchingTime
				eggType={eggType ?? EggType.Normal}
				leftTime={leftTime}
				maxTime={maxTime}
			/>
		</billboardgui>
	);
}
