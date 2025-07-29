import { lerpBinding } from "@rbxts/pretty-react-hooks";
import React, { useEffect } from "@rbxts/react";

import { palette, springs } from "client/constants";
import { Frame } from "client/ui/components/primitive";
import { Outline } from "client/ui/components/primitive/outline";
import { Shadow } from "client/ui/components/primitive/shadow";
import { ReactiveButton } from "client/ui/components/reactive-button";
import { useMotion, useRem } from "client/ui/hooks";

interface ItemCardProps {
	/** 是否为持有的物品. */
	held?: boolean;
	onClick?: () => void;
}

export function ItemCard(props: ItemCardProps): React.ReactNode {
	const rem = useRem();
	const { held = false, onClick } = props;
	const [transparency, transparencyMotion] = useMotion(0);
	const [scale, scaleMotion] = useMotion(0);

	useEffect(() => {
		if (held) {
			transparencyMotion.spring(1);
		} else {
			transparencyMotion.spring(0, springs.responsive);
		}
	}, [held, transparencyMotion]);

	useEffect(() => {
		scaleMotion.spring(1, springs.linear);
	}, [scaleMotion]);

	return (
		<ReactiveButton
			AnimatePositionStrength={0.7}
			AnimateSizeStrength={0.5}
			Native={{
				BackgroundTransparency: 1,
				Size: lerpBinding(scale, new UDim2(), new UDim2(0, rem(6.5), 0, rem(6.5))),
			}}
			onClick={onClick}
		>
			<Shadow
				ShadowBlur={0.3}
				ShadowColor={palette.base}
				ShadowPosition={0}
				ShadowSize={rem(8)}
				ShadowTransparency={0.4}
			/>

			<Frame
				CornerRadius={new UDim(0, rem(0.5))}
				Native={{
					BackgroundColor3: lerpBinding(transparency, palette.base, palette.overlay0),
					BackgroundTransparency: 0.5,
					BorderSizePixel: 0,
				}}
			/>

			<Outline
				CornerRadius={new UDim(0, rem(0.5))}
				InnerColor={lerpBinding(transparency, palette.base, palette.white)}
				InnerThickness={rem(3, "pixel")}
				InnerTransparency={lerpBinding(transparency, 0.9, 0.1)}
				OuterColor={palette.white}
				OuterThickness={rem(1.5, "pixel")}
				OutlineTransparency={0}
			/>
		</ReactiveButton>
	);
}
