import { lerpBinding, useMotion, useTimer } from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";

import { palette } from "client/constants";
import { Frame, TextLabel } from "client/ui/components/primitive";
import { Outline } from "client/ui/components/primitive/outline";
import { useRem } from "client/ui/hooks";
import { generateColorSequence } from "client/utils/color-utils";
import type { EggType } from "shared/types";

export function HatchingCD({
	leftTime,
	maxTime,
}: {
	leftTime: number;
	maxTime: number;
}): React.ReactNode {
	const rem = useRem();
	const gradient = generateColorSequence([palette.sapphire, palette.blue, palette.sapphire]);
	const timer = useTimer();

	const [progress, progressMotion] = useMotion(leftTime / maxTime);

	const cd = timer.value.map(dt => {
		// 更新进度
		const left = math.clamp(math.floor(leftTime - dt), 0, maxTime);
		progressMotion.spring(left / maxTime);
		return `${left}s`;
	});

	return (
		<Frame
			CornerRadius={new UDim(0, rem(5, "pixel"))}
			Native={{
				BackgroundTransparency: 1,
				Size: new UDim2(1, 0, 0.25, 0),
			}}
		>
			<Frame
				CornerRadius={new UDim(0, rem(5, "pixel"))}
				Native={{
					BackgroundColor3: palette.base,
					BackgroundTransparency: 0.5,
					Size: new UDim2(1, 0, 0.5, 0),
				}}
			>
				<Outline
					CornerRadius={new UDim(0, rem(5, "pixel"))}
					InnerColor={palette.base}
					InnerThickness={rem(3, "pixel")}
					InnerTransparency={0.3}
					OuterColor={palette.white}
					OuterThickness={rem(1.5, "pixel")}
					OutlineTransparency={0}
				/>
				<Frame
					CornerRadius={new UDim(0, rem(5, "pixel"))}
					Native={{
						AnchorPoint: new Vector2(0, 0.5),
						BackgroundColor3: palette.white,
						BackgroundTransparency: 0,
						Position: new UDim2(0, rem(3, "pixel"), 0.5, 0),
						Size: lerpBinding(
							progress,
							new UDim2(0, 0, 1, -rem(3, "pixel")),
							new UDim2(1, -rem(6, "pixel"), 1, -rem(3, "pixel")),
						),
					}}
				>
					<uigradient Color={gradient} />
				</Frame>
			</Frame>

			<TextLabel
				Native={{
					AnchorPoint: new Vector2(0.5, 0.5),
					BackgroundTransparency: 1,
					Position: new UDim2(0.5, 0, 0.5, 0),
					Size: new UDim2(1, 0, 1, 0),
					TextScaled: true,
					ZIndex: 10,
				}}
				StrokeSize={rem(2, "pixel")}
				Text={cd}
				TextColor={palette.white}
			/>
		</Frame>
	);
}

export function HatchingTime({
	eggType,
	leftTime,
	maxTime,
}: {
	eggType: EggType;
	leftTime: number;
	maxTime: number;
}): React.ReactNode {
	const rem = useRem();
	return (
		<>
			<TextLabel
				Native={{
					Size: new UDim2(1, 0, 0.25, 0),
					TextScaled: true,
				}}
				StrokeSize={rem(2, "pixel")}
				Text="Hatching in"
				TextColor={palette.white}
			/>
			<HatchingCD leftTime={leftTime} maxTime={maxTime} />

			<TextLabel
				Native={{
					Size: new UDim2(1, 0, 0.25, 0),
					TextScaled: true,
				}}
				StrokeSize={rem(2, "pixel")}
				Text={tostring(eggType).upper()}
				TextColor={palette.white}
			/>
		</>
	);
}
