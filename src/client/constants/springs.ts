import type { SpringOptions } from "@rbxts/ripple";
import { config } from "@rbxts/ripple";

export const springs = {
	...config.spring,
	bubbly: { friction: 14, tension: 400 },
	gentle: { friction: 30, tension: 250 },
	linear: { frequency: 0.1, friction: 30 },
	responsive: { tension: 400 },
	world: { friction: 30, tension: 180 },
} satisfies Record<string, SpringOptions>;
