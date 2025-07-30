import React, { forwardRef } from "@rbxts/react";

import { useRem } from "client/ui/hooks";
import type { BindingValue } from "types/util/react";

import type { FrameProps } from "./frame";

function createFont(font: string, weight: Enum.FontWeight, style: Enum.FontStyle): Font {
	return new Font(font, weight, style);
}

export interface TextLabelProps extends FrameProps<TextLabel> {
	/**
	 * The font of the text, defaults to the primary font specified by the
	 * default theme.
	 */
	Font?: BindingValue<Enum.Font>;
	FontStyle?: Enum.FontStyle;
	/**
	 * The default properties of a `TextLabel` component, minus the ones
	 * specified in the TextProps.
	 */
	Native?: Partial<
		Omit<
			React.InstanceProps<TextLabel>,
			"Font" | "Text" | "TextColor3" | "TextColor" | "TextSize"
		>
	>;
	StrokeColor?: BindingValue<Color3>;
	StrokeSize?: BindingValue<number>;
	/** The text to display. */
	Text: BindingValue<string>;

	/** The color of the text. */
	TextColor?: BindingValue<Color3>;
	/** The size of the text. */
	TextSize?: BindingValue<number>;
}

/**
 * Renders a text label component.
 *
 * @example
 *
 * ```tsx
 * <TextLabel
 * 	Text={"Hello, world!"}
 * 	Native={{ Size: new UDim2(0, 100, 0, 50) }}
 * />;
 * ```
 *
 * @param textProps - The props for the TextLabel component.
 * @returns The rendered TextLabel component.
 * @component
 *
 * @see https://create.roblox.com/docs/reference/engine/classes/TextLabel
 */
export const TextLabel = forwardRef(
	(props: Readonly<TextLabelProps>, ref: React.Ref<TextLabel>) => {
		const {
			CornerRadius,
			FontStyle,
			Native,
			StrokeColor,
			StrokeSize,
			Text,
			TextColor,
			TextSize,
			children,
		} = props;

		const rem = useRem();

		return (
			<textlabel
				ref={ref}
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundTransparency={1}
				// Font={Font ?? theme.fonts.body}
				FontFace={createFont(
					"rbxasset://fonts/families/GothamSSm.json",
					Enum.FontWeight.ExtraBold,
					FontStyle ?? Enum.FontStyle.Normal,
				)}
				Position={new UDim2(0.5, 0, 0.5, 0)}
				Text={Text}
				TextColor3={TextColor}
				TextSize={TextSize ?? rem(1)}
				{...Native}
			>
				{children}
				{CornerRadius ? <uicorner CornerRadius={CornerRadius} /> : undefined}
				{StrokeSize !== undefined ? (
					<uistroke
						Color={StrokeColor ?? Color3.fromHex("#000000")}
						Thickness={StrokeSize}
					/>
				) : undefined}
			</textlabel>
		);
	},
);
