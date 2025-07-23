import {
	blend,
	composeBindings,
	lerpBinding,
	useMotion,
	useUpdateEffect,
} from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";

import { useButtonState, useRem } from "client/ui/hooks";

import { useButtonAnimation } from "../hooks/use-button-animation";
import { Button, type ButtonProps, Frame } from "./primitive";

interface ReactiveButtonProps extends ButtonProps {
	AnimatePosition?: boolean;
	AnimatePositionDirection?: Vector2;
	AnimatePositionStrength?: number;
	AnimateSize?: boolean;
	AnimateSizeStrength?: number;
	Enabled?: boolean;
}

export function ReactiveButton(props: ReactiveButtonProps): React.ReactNode {
	const rem = useRem();
	const [sizeAnimation, sizeMotion] = useMotion(0);
	const [press, hover, buttonEvents] = useButtonState();
	const animation = useButtonAnimation(press, hover);
	const {
		AnimatePosition: animatePosition = true,
		AnimatePositionDirection: animatePositionDirection = new Vector2(0, 1),
		AnimatePositionStrength: animatePositionStrength = 1,
		AnimateSize: animateSize = true,
		AnimateSizeStrength: animateSizeStrength = 1,
		CornerRadius,
		Enabled = true,
		Native,
		onHover,
		onMouseDown,
		onMouseEnter,
		onMouseLeave,
		onMouseUp,
		onPress,
		children,
	} = props;

	useUpdateEffect(() => {
		if (press) {
			sizeMotion.spring(-0.1, { tension: 300 });
		} else {
			sizeMotion.spring(0, { impulse: 0.01, tension: 300 });
		}
	}, [press]);

	useUpdateEffect(() => {
		onHover?.(hover);
	}, [hover]);

	useUpdateEffect(() => {
		onPress?.(press);
	}, [press]);

	return (
		<Button
			Native={{
				BackgroundTransparency: 1,
				...Native,
			}}
			onMouseDown={() => {
				if (!Enabled) {
					return;
				}

				buttonEvents.onMouseDown();
				onMouseDown?.();
			}}
			onMouseEnter={() => {
				buttonEvents.onMouseEnter();
				onMouseEnter?.();
			}}
			onMouseLeave={() => {
				buttonEvents.onMouseLeave();
				onMouseLeave?.();
			}}
			onMouseUp={() => {
				if (!Enabled) {
					return;
				}

				buttonEvents.onMouseUp();
				onMouseUp?.();
			}}
		>
			<Frame
				CornerRadius={CornerRadius}
				Native={{
					BackgroundColor3: composeBindings(
						animation.hoverOnly,
						animation.press,
						Native?.BackgroundColor3 ?? new Color3(1, 1, 1),
						(hovered, pressed, color) => {
							return color
								.Lerp(new Color3(1, 1, 1), hovered * 0.15)
								.Lerp(new Color3(), pressed * 0.1);
						},
					),
					BackgroundTransparency: composeBindings(
						animation.press,
						Native?.BackgroundTransparency ?? 0,
						(pressed, transparency) => blend(-pressed * 0.2, transparency),
					),
					Position: lerpBinding(
						animatePosition ? animation.position : 0,
						new UDim2(0.5, 0, 0.5, 0),
						new UDim2(
							0.5,
							(3 + rem(0.1)) * animatePositionStrength * animatePositionDirection.X,
							0.5,
							(3 + rem(0.1)) * animatePositionStrength * animatePositionDirection.Y,
						),
					),
					Size: lerpBinding(
						animateSize ? sizeAnimation : 0,
						new UDim2(1, 0, 1, 0),
						new UDim2(1, rem(2 * animateSizeStrength), 1, rem(2 * animateSizeStrength)),
					),
				}}
			>
				{children}
			</Frame>
		</Button>
	);
}
