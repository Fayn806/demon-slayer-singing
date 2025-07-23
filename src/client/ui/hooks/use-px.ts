import { useCamera, useDebounceState, useEventListener } from "@rbxts/pretty-react-hooks";
import { useMemo } from "@rbxts/react";

interface ScaleFunction {
	/** Scales `pixels` based on the current viewport size and rounds the result. */
	(pixels: number): number;
	/** Scales `pixels` and rounds the result up. */
	ceil: (pixels: number) => number;
	/** Scales `pixels` and rounds the result to the nearest even number. */
	even: (pixels: number) => number;
	/** Scales `pixels` and rounds the result down. */
	floor: (pixels: number) => number;
	/** Scales a number based on the current viewport size without rounding. */
	scale: (percent: number) => number;
}

const BASE_RESOLUTION = new Vector2(1920, 1080);
const MIN_SCALE = 0.35;
const DOMINANT_AXIS = 0.5;

function calculateScale(viewport: Vector2): number {
	const width = math.log(viewport.X / BASE_RESOLUTION.X, 2);
	const height = math.log(viewport.Y / BASE_RESOLUTION.Y, 2);
	const centered = width + (height - width) * DOMINANT_AXIS;

	return math.max(2 ** centered, MIN_SCALE);
}

export function usePx(): ScaleFunction {
	const camera = useCamera();

	const [scale, setScale] = useDebounceState(calculateScale(camera.ViewportSize), {
		leading: true,
		wait: 0.2,
	});

	useEventListener(camera.GetPropertyChangedSignal("ViewportSize"), () => {
		setScale(calculateScale(camera.ViewportSize));
	});

	return useMemo(() => {
		const api = {
			ceil: (value: number) => math.ceil(value * scale),
			even: (value: number) => math.round(value * scale * 0.5) * 2,
			floor: (value: number) => math.floor(value * scale),
			scale: (value: number) => value * scale,
		};

		setmetatable(api, {
			__call: (_, value) => math.round((value as number) * scale),
		});

		return api as ScaleFunction;
	}, [scale]);
}
