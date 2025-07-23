import { blend, composeBindings } from "@rbxts/pretty-react-hooks";
import React, { useMemo } from "@rbxts/react";

import { palette } from "client/constants";

import { useRem } from "../../hooks";
import { type FrameProps, Group } from ".";

interface OutlineProps extends FrameProps {
	readonly InnerColor?: Color3 | React.Binding<Color3>;
	readonly InnerThickness?: number | React.Binding<number>;
	readonly InnerTransparency?: number | React.Binding<number>;
	readonly OuterColor?: Color3 | React.Binding<Color3>;
	readonly OuterThickness?: number | React.Binding<number>;
	readonly OuterTransparency?: number | React.Binding<number>;
	readonly OutlineTransparency?: number | React.Binding<number>;
}

function ceilEven(value: number): number {
	return math.ceil(value / 2) * 2;
}

export function Outline(props: OutlineProps): React.ReactNode {
	const rem = useRem();

	let {
		CornerRadius,
		InnerColor = palette.white,
		InnerThickness,
		InnerTransparency = 0.9,
		OuterColor = palette.black,
		OuterThickness,
		OuterTransparency = 0.85,
		OutlineTransparency = 0,
		children,
	} = props;

	InnerThickness ??= rem(3, "pixel");
	OuterThickness ??= rem(1.5, "pixel");
	CornerRadius ??= new UDim(0, rem(0.5));

	const innerStyle = useMemo(() => {
		const size = composeBindings(
			InnerThickness,
			thickness => new UDim2(1, ceilEven(-2 * thickness), 1, ceilEven(-2 * thickness)),
		);

		const position = composeBindings(
			InnerThickness,
			thickness => new UDim2(0, thickness, 0, thickness),
		);

		const radius = composeBindings(CornerRadius, InnerThickness, (radius_, thickness) =>
			radius_.sub(new UDim(0, thickness)),
		);

		const transparency = composeBindings(OutlineTransparency, InnerTransparency, (a, b) =>
			math.clamp(blend(a, b), 0, 1),
		);

		return { position, radius, size, transparency };
	}, [InnerThickness, InnerTransparency, CornerRadius, OutlineTransparency]);

	const outerStyle = useMemo(() => {
		const transparency = composeBindings(OutlineTransparency, OuterTransparency, (a, b) =>
			math.clamp(blend(a, b), 0, 1),
		);

		return { transparency };
	}, [OutlineTransparency, OuterTransparency]);

	return (
		<>
			<Group
				Native={{
					AnchorPoint: new Vector2(),
					Position: innerStyle.position,
					Size: innerStyle.size,
				}}
			>
				<uicorner CornerRadius={innerStyle.radius} />
				<uistroke
					Color={InnerColor}
					Thickness={InnerThickness}
					Transparency={innerStyle.transparency}
				>
					{children}
				</uistroke>
			</Group>

			<Group>
				<uicorner CornerRadius={CornerRadius} />
				<uistroke
					Color={OuterColor}
					Thickness={OuterThickness}
					Transparency={outerStyle.transparency}
				>
					{children}
				</uistroke>
			</Group>
		</>
	);
}
