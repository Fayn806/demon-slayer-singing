import { blend, composeBindings, lerpBinding, useMotion } from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";

import { useRem } from "../hooks";
import { type ButtonProps, Frame, ImageLabel } from "./primitive";
import { Outline } from "./primitive/outline";
import { Shadow } from "./primitive/shadow";
import { ReactiveButton } from "./reactive-button";

interface PrimaryButtonProps extends ButtonProps {
	readonly OverlayGradient?: ColorSequence | React.Binding<ColorSequence>;
	readonly OverlayRotation?: number | React.Binding<number>;
	readonly OverlayTransparency?: number | React.Binding<number>;
}

const IMAGE_ID = "rbxassetid://14367671668";

export function PrimaryButton(props: PrimaryButtonProps): React.ReactNode {
	const rem = useRem();
	const [hover, hoverMotion] = useMotion(0);
	const {
		Native,
		onHover,
		OverlayGradient: overlayGradient,
		OverlayRotation: overlayRotation,
		OverlayTransparency: overlayTransparency = 0,
		children,
	} = props;

	return (
		<ReactiveButton
			Native={{
				BackgroundTransparency: 1,
				...Native,
			}}
			onHover={hovered => {
				hoverMotion.spring(hovered ? 1 : 0);
				onHover?.(hovered);
			}}
		>
			<Shadow
				ShadowBlur={0.2}
				ShadowPosition={rem(0.5)}
				ShadowSize={rem(2.5)}
				ShadowTransparency={lerpBinding(hover, 0.7, 0.4)}
			/>

			<Frame
				CornerRadius={new UDim(0, rem(1))}
				Native={{
					BackgroundColor3: new Color3(1, 1, 1),
					Size: new UDim2(1, 0, 1, 0),
				}}
			>
				<uigradient
					Offset={lerpBinding(hover, new Vector2(), new Vector2(0, 1))}
					Rotation={90}
					Transparency={new NumberSequence(0, 0.1)}
				/>
			</Frame>

			<Outline CornerRadius={new UDim(0, rem(1))} InnerTransparency={0} />

			<ImageLabel
				CornerRadius={new UDim(0, rem(1))}
				Image={IMAGE_ID}
				Native={{
					ImageTransparency: composeBindings(
						overlayTransparency,
						lerpBinding(hover, 0.3, 0),
						blend,
					),
					Size: new UDim2(1, 0, 1, 0),
				}}
			>
				<uigradient Color={overlayGradient} Rotation={overlayRotation} />
			</ImageLabel>

			{children}
		</ReactiveButton>
	);
}
