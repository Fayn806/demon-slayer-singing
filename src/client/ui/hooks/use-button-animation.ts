import { useMotion, useUpdateEffect } from "@rbxts/pretty-react-hooks";
import type React from "@rbxts/react";
import { useMemo } from "@rbxts/react";

import { springs } from "client/constants/springs";

export interface ButtonAnimation {
	/** A critically damped spring that is `1` when the button is hovered. */
	readonly hover: React.Binding<number>;
	/** Same as `hover`, but `pressed` must be `false`. */
	readonly hoverOnly: React.Binding<number>;
	/**
	 * An under damped spring. `-1` is fully hovered, `0` is neutral, and `1` is
	 * fully pressed. Values outside of this range are possible.
	 */
	readonly position: React.Binding<number>;
	/** A critically damped spring that is `1` when the button is pressed. */
	readonly press: React.Binding<number>;
}

/**
 * Returns a `ButtonAnimation` object that can be used to animate a button. The
 * values provided by the object are:
 *
 * - `position`: An under damped spring. `-1` is fully hovered, `0` is neutral,
 *   and `1` is fully pressed. Values outside of this range are possible.
 * - `press`: A critically damped spring that is `1` when the button is pressed.
 * - `hover`: A critically damped spring that is `1` when the button is hovered.
 * - `hoverExclusive`: Same as `hover`, but `pressed` must also be `false`.
 *
 * @param pressedState - Whether the button is pressed.
 * @param hoveredState - Whether the button is hovered.
 * @returns A `ButtonAnimation` object.
 */
export function useButtonAnimation(pressedState: boolean, hoveredState: boolean): ButtonAnimation {
	const [press, pressMotion] = useMotion(0);
	const [hover, hoverMotion] = useMotion(0);
	const [hoverExclusive, hoverExclusiveMotion] = useMotion(0);
	const [position, positionMotion] = useMotion(0);

	useUpdateEffect(() => {
		pressMotion.spring(pressedState ? 1 : 0, springs.responsive);
		hoverExclusiveMotion.spring(hoveredState && !pressedState ? 1 : 0, springs.responsive);
	}, [pressedState, hoveredState]);

	useUpdateEffect(() => {
		hoverMotion.spring(hoveredState ? 1 : 0, springs.responsive);
	}, [hoveredState]);

	useUpdateEffect(() => {
		if (pressedState) {
			// hovered -> pressed
			positionMotion.spring(1, springs.responsive);
		} else if (hoveredState) {
			// pressed -> hovered
			positionMotion.spring(-1, { ...springs.bubbly, impulse: -0.1 });
		} else {
			// pressed -> un hovered, but 'hover' was not true
			positionMotion.spring(0, { ...springs.bubbly, impulse: -0.07 });
		}
	}, [pressedState]);

	useUpdateEffect(() => {
		if (hoveredState) {
			// un hovered -> hovered
			positionMotion.spring(-1, springs.responsive);
		} else {
			// hovered -> un hovered
			positionMotion.spring(0, springs.responsive);
		}
	}, [hoveredState]);

	return useMemo<ButtonAnimation>(() => {
		return {
			hover: hover.map(dt => math.clamp(dt, 0, 1)),
			hoverOnly: hoverExclusive.map(dt => math.clamp(dt, 0, 1)),
			position,
			press,
		};
	}, [press, hover, hoverExclusive, position]);
}
