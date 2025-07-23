/* eslint-disable id-length -- Single letter variables are appropriate for HSV color components */
/* eslint-disable ts/no-shadow -- Destructuring color components with same names is clear */
/* eslint-disable ts/explicit-function-return-type -- Return types are inferred from Color3 methods */
/* eslint-disable @cspell/spellchecker -- Contains non-English documentation */
/* eslint-disable jsdoc/require-returns -- Some functions have obvious return types */
/* eslint-disable jsdoc/require-description -- Function names are self-descriptive */
/**
 * @param color - The color to brighten or darken.
 * @param brightness - The amount to brighten or darken the color.
 * @param vibrancy - How much saturation changes with brightness.
 */
export function brighten(color: Color3, brightness: number, vibrancy = 0.5) {
	const [h, s, v] = color.ToHSV();
	return Color3.fromHSV(
		h,
		math.clamp(s - brightness * vibrancy, 0, 1),
		math.clamp(v + brightness, 0, 1),
	);
}

/**
 * @param color - The color to saturate or desaturate.
 * @param saturation - How much to add or remove from the color's saturation.
 */
export function saturate(color: Color3, saturation: number) {
	const [h, s, v] = color.ToHSV();
	return Color3.fromHSV(h, math.clamp(s + saturation, 0, 1), v);
}

/**
 * @param color - 颜色.
 * @returns How bright the color is.
 */
export function getLuminance(color: Color3): number {
	return color.R * 0.299 + color.G * 0.587 + color.B * 0.114;
}

/**
 * @param color - 颜色.
 * @returns Whether the color is bright, for determining foreground color.
 */
export function isBright(color: Color3) {
	return getLuminance(color) > 0.65;
}

const lerpAlpha = (a: number, b: number, t: number) => math.clamp(a + (b - a) * t, 0, 1);

export function darken(color: Color3, amount: number, saturation = 0.25 * amount) {
	const [h, s, v] = color.ToHSV();

	return Color3.fromHSV(h, lerpAlpha(s, 1, saturation), lerpAlpha(v, 0, 0.7 * amount));
}

export function brightness(color: Color3) {
	const [r, g, b] = [color.R, color.G, color.B];

	return (r * 299 + g * 587 + b * 114) / 1000;
}

export function brightenIfDark(color: Color3) {
	const darkness = 1 - brightness(color);

	return darkness > 0.5 ? brighten(color, darkness, 0.5) : color;
}
