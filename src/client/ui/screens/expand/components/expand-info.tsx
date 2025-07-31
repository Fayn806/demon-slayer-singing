import { lerpBinding, useMotion } from "@rbxts/pretty-react-hooks";
import React, { useEffect } from "@rbxts/react";

import { palette, springs } from "client/constants";
import { Frame, TextLabel } from "client/ui/components/primitive";
import { Shadow } from "client/ui/components/primitive/shadow";
import { useRem } from "client/ui/hooks";
import { generateColorSequence } from "client/utils/color-utils";

interface ExpandInfoProps {
	price: number;
	selected: boolean;
}

export function ExpandInfo(props: ExpandInfoProps): React.ReactNode {
	const rem = useRem();
	const coinLabelGradient = generateColorSequence([palette.peach, Color3.fromRGB(0, 255, 0)]);
	const { price, selected } = props;
	const [size, sizeMotion] = useMotion(0);

	const colors = [palette.peach, Color3.fromRGB(0, 255, 0)];
	const confirmLabelGradient = generateColorSequence(colors);

	useEffect(() => {
		if (selected) {
			sizeMotion.spring(1, springs.responsive);
		}
	}, [selected, sizeMotion]);

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

				<Frame
					Native={{
						BackgroundColor3: palette.black,
						BackgroundTransparency: 0,
						ClipsDescendants: true,
						Size: new UDim2(0.7, 0, 0.6, 0),
					}}
				>
					<uigradient
						Transparency={
							new NumberSequence([
								new NumberSequenceKeypoint(0, 1),
								new NumberSequenceKeypoint(0.5, 0.5),
								new NumberSequenceKeypoint(1, 1),
							])
						}
					/>
					<TextLabel
						Native={{
							key: "price-label",
							Size: new UDim2(1, 0, 1, 0),
							TextScaled: true,
						}}
						StrokeSize={rem(2, "pixel")}
						Text={`$${price}`}
						TextColor={palette.white}
					>
						<uigradient Color={coinLabelGradient} Rotation={90} />
					</TextLabel>
				</Frame>

				<TextLabel
					Native={{
						key: "expand-label",
						Size: new UDim2(1, 0, 0.6, 0),
						TextScaled: true,
					}}
					StrokeSize={rem(2, "pixel")}
					Text="To Expand"
					TextColor={palette.white}
				/>
				{selected && (
					<Frame
						Native={{
							BackgroundTransparency: 1,
							Size: lerpBinding(size, new UDim2(1, 0, 0, 0), new UDim2(1, 0, 0.7, 0)),
						}}
					>
						<TextLabel
							Native={{
								BackgroundTransparency: 1,
								Size: new UDim2(1, 0, 1, 0),
								TextScaled: true,
							}}
							StrokeSize={rem(2, "pixel")}
							Text="Click to confirm?"
							TextColor={palette.white}
						>
							<uigradient Color={confirmLabelGradient} Rotation={90} />
						</TextLabel>
					</Frame>
				)}
			</Frame>
		</Frame>
	);
}
