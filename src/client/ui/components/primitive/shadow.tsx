import { composeBindings } from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";

import { useRem } from "../../hooks";
import { type FrameProps, ImageLabel } from ".";

interface ShadowProps extends FrameProps {
	ShadowBlur?: number;
	ShadowColor?: Color3 | React.Binding<Color3>;
	ShadowPosition?: number | React.Binding<number>;
	ShadowSize?: number | React.Binding<number | UDim2> | UDim2;
	ShadowTransparency?: number | React.Binding<number>;
}

const IMAGE_ID = "rbxassetid://14120516187";
const IMAGE_SIZE = new Vector2(512, 512);
const BLUR_RADIUS = 80;

export function Shadow(props: ShadowProps): React.ReactNode {
	let {
		ShadowBlur = 0.2,
		ShadowColor = new Color3(),
		ShadowPosition,
		ShadowSize = 0,
		ShadowTransparency = 0.5,
		children,
	} = props;

	const rem = useRem();

	ShadowPosition ??= rem(1);

	return (
		<ImageLabel
			Image={IMAGE_ID}
			Native={{
				ImageColor3: ShadowColor,
				ImageTransparency: ShadowTransparency,
				Position: composeBindings(ShadowPosition, offset => new UDim2(0.5, 0, 0.5, offset)),
				ScaleType: Enum.ScaleType.Slice,
				Size: composeBindings(ShadowSize, size => {
					const sizeOffsetScaled = rem(BLUR_RADIUS * ShadowBlur, "pixel");

					return typeIs(size, "UDim2")
						? new UDim2(1, sizeOffsetScaled, 1, sizeOffsetScaled).add(size)
						: new UDim2(1, size + sizeOffsetScaled, 1, size + sizeOffsetScaled);
				}),
				SliceCenter: new Rect(IMAGE_SIZE.div(2), IMAGE_SIZE.div(2)),
				SliceScale: rem(BLUR_RADIUS * ShadowBlur, "pixel"),
			}}
		>
			{children}
		</ImageLabel>
	);
}
