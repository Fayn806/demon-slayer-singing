import { useUpdateEffect } from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";

import { useButtonState } from "client/ui/hooks/use-button-state";

import type { FrameProps } from "./frame";

export interface ButtonProps extends FrameProps<TextButton> {
	/** The default properties of a `TextButton` component. */
	Native?: Partial<React.InstanceProps<TextButton>>;
	/** A callback that is triggered when the button is clicked. */
	onClick?: () => void;
	onHover?: (hovered: boolean) => void;
	/**
	 * A callback that is triggered when the mouse button is pressed down on the
	 * button.
	 */
	onMouseDown?: () => void;
	/** A callback that is triggered when the mouse enters the button. */
	onMouseEnter?: () => void;
	/** A callback that is triggered when the mouse leaves the button. */
	onMouseLeave?: () => void;
	/**
	 * A callback that is triggered when the mouse button is released on the
	 * button.
	 */
	onMouseUp?: () => void;
	onPress?: (pressed: boolean) => void;
}

/**
 * Button component.
 *
 * @example
 *
 * ```tsx
 * <Button
 * 	CornerRadius={new UDim(0, 8)}
 * 	Native={{ Size: new UDim2(0, 100, 0, 100) }}
 * 	onClick={useCallback(() => {
 * 		print("Hello World!");
 * 	}, [])}
 * />;
 * ```
 *
 * Button is released on the button.
 *
 * @param buttonProps - The properties of the Button component.
 * @returns The rendered Button component.
 * @component
 *
 * @see https://create.roblox.com/docs/reference/engine/classes/TextButton
 */
export function Button({
	CornerRadius,
	Native,
	onClick,
	onHover,
	onMouseDown,
	onMouseEnter,
	onMouseLeave,
	onMouseUp,
	onPress,
	children,
}: Readonly<ButtonProps>): React.ReactNode {
	const [press, hover, buttonEvents] = useButtonState();

	const event = {
		Activated: () => {
			onClick?.();
		},
		MouseButton1Down: () => {
			buttonEvents.onMouseDown();
			onMouseDown?.();
		},
		MouseButton1Up: () => {
			buttonEvents.onMouseUp();
			onMouseUp?.();
		},
		MouseEnter: () => {
			buttonEvents.onMouseEnter();
			onMouseEnter?.();
		},
		MouseLeave: () => {
			buttonEvents.onMouseLeave();
			onMouseLeave?.();
		},
		...Native?.Event,
	};

	useUpdateEffect(() => {
		onHover?.(hover);
	}, [hover]);

	useUpdateEffect(() => {
		onPress?.(press);
	}, [press]);

	return (
		<textbutton
			AnchorPoint={new Vector2(0.5, 0.5)}
			Event={event}
			Position={new UDim2(0.5, 0, 0.5, 0)}
			Text=""
			{...Native}
		>
			{CornerRadius ? <uicorner CornerRadius={CornerRadius} /> : undefined}
			{children}
		</textbutton>
	);
}
