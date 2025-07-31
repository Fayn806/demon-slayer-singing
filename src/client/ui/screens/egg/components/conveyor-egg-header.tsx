import React from "@rbxts/react";

import { palette } from "client/constants";
import { Frame, TextLabel } from "client/ui/components/primitive";
import { Shadow } from "client/ui/components/primitive/shadow";
import { useRem } from "client/ui/hooks";
import { generateColorSequence } from "client/utils/color-utils";
import type { EggRarity } from "shared/types";
import { EggMutation } from "shared/types";

export function ConveyorEggHeader({
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
	const rem = useRem();

	const coinLabelGradient = generateColorSequence([palette.peach, Color3.fromRGB(0, 255, 0)]);
	const rarityGradient = generateColorSequence([palette.white, palette.subtext0]);

	const price = `$${cost}`;
	const mutationsText = mutations
		.map(mutation => {
			if (mutation === EggMutation.Normal) {
				return "";
			}

			return mutation.upper();
		})
		.join(" ");
	return (
		<Frame
			Native={{
				BackgroundTransparency: 1,
				Size: new UDim2(1, 0, 1, 0),
			}}
		>
			<Shadow
				ShadowBlur={1}
				ShadowColor={palette.base}
				ShadowPosition={0}
				ShadowSize={new UDim2(1, 0, 1, 0)}
				ShadowTransparency={0.9}
			/>
			<Frame
				Native={{
					BackgroundTransparency: 1,
					Size: new UDim2(1, 0, 1, 0),
					ZIndex: 2,
				}}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					Padding={new UDim(0, 0.03)}
					SortOrder={Enum.SortOrder.LayoutOrder}
					VerticalAlignment={Enum.VerticalAlignment.Center}
				/>

				<TextLabel
					Native={{
						key: "mutation-label",
						Size: new UDim2(1, 0, 0.2, 0),
						TextScaled: true,
					}}
					StrokeSize={rem(2, "pixel")}
					Text={tostring(mutationsText)}
					TextColor={palette.white}
				/>

				<TextLabel
					Native={{
						key: "rarity-label",
						Size: new UDim2(1, 0, 0.2, 0),
						TextScaled: true,
					}}
					StrokeSize={rem(2, "pixel")}
					Text={tostring(rarity)}
					TextColor={palette.white}
				>
					<uigradient Color={rarityGradient} Rotation={20} />
				</TextLabel>

				<TextLabel
					Native={{
						key: "name-label",
						Size: new UDim2(1, 0, 0.3, 0),
						TextScaled: true,
					}}
					StrokeSize={rem(2, "pixel")}
					Text={eggName}
					TextColor={palette.white}
				/>

				<TextLabel
					Native={{
						key: "price-label",
						Size: new UDim2(1, 0, 0.25, 0),
						TextScaled: true,
					}}
					StrokeSize={rem(2, "pixel")}
					Text={price}
					TextColor={palette.white}
				>
					<uigradient Color={coinLabelGradient} Rotation={90} />
				</TextLabel>
			</Frame>
		</Frame>
	);
}
