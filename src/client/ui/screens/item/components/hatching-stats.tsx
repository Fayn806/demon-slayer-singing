import { lerpBinding, useInterval, useMotion, useTimer } from "@rbxts/pretty-react-hooks";
import React, { useEffect, useMemo, useState } from "@rbxts/react";
import { Workspace } from "@rbxts/services";

import { palette, USER_ID } from "client/constants";
import { store } from "client/store";
import { Frame, TextLabel } from "client/ui/components/primitive";
import { Outline } from "client/ui/components/primitive/outline";
import { Shadow } from "client/ui/components/primitive/shadow";
import { useRem } from "client/ui/hooks";
import { generateColorSequence } from "client/utils/color-utils";
import { selectPlacedEggBoosters, selectPlacedItemById } from "shared/store/players/selectors";
import type { EggMutation, PlacedEgg } from "shared/types";
import { calculateBonus } from "shared/util/calculate-utils/bonus";

export function HatchingCD({
	maxTime,
	placedTime,
}: {
	maxTime: number;
	placedTime: number;
}): React.ReactNode {
	const rem = useRem();
	const gradient = generateColorSequence([palette.sapphire, palette.blue, palette.sapphire]);
	const timer = useTimer();

	const runtime = math.floor(math.min(Workspace.GetServerTimeNow() - placedTime, maxTime));
	const [progress, progressMotion] = useMotion((maxTime - runtime) / maxTime);

	const cd = timer.value.map(() => {
		// 更新进度
		const newRuntime = math.floor(math.min(Workspace.GetServerTimeNow() - placedTime, maxTime));
		progressMotion.spring((maxTime - newRuntime) / maxTime);
		return `${maxTime - newRuntime}s`;
	});

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
		</>
	);
}

export function HatchingStats({ instanceId }: { instanceId: string }): React.ReactNode {
	const rem = useRem();
	const placedEgg = store.getState(selectPlacedItemById(USER_ID, instanceId)) as
		| PlacedEgg
		| undefined;

	const effectBoosters = useMemo(() => {
		return placedEgg
			? store.getState(selectPlacedEggBoosters(USER_ID, placedEgg.instanceId))
			: [];
	}, [placedEgg]);
	const [bonusMap, setBonusMap] = useState(() =>
		placedEgg ? calculateBonus(placedEgg, effectBoosters) : new Map(),
	);

	useEffect(() => {
		if (!placedEgg) {
			return;
		}

		const unsubscribe = store.subscribe(
			selectPlacedEggBoosters(USER_ID, placedEgg.instanceId),
			(state, pre) => state.size() !== pre.size(),
			() => {
				setBonusMap(calculateBonus(placedEgg, effectBoosters));
			},
		);
		return () => {
			unsubscribe();
		};
	}, [placedEgg, effectBoosters]);

	useInterval(() => {
		if (!placedEgg) {
			return;
		}

		setBonusMap(calculateBonus(placedEgg, effectBoosters));
	}, 1);

	if (!placedEgg) {
		return undefined;
	}

	const { hatchLeftTime, mutations, placedTime } = placedEgg;
	const eggMutations = mutations.map((mutation: EggMutation) => tostring(mutation));

	return (
		<Frame
			Native={{
				BackgroundTransparency: 1,
				Size: new UDim2(1, 0, 1, 0),
			}}
		>
			<Shadow
				ShadowBlur={1}
				ShadowColor={palette.base}
				ShadowPosition={0}
				ShadowSize={new UDim2(1, 0, 1, 0)}
				ShadowTransparency={0.9}
			/>
			<Frame
				Native={{
					BackgroundTransparency: 1,
					Size: new UDim2(1, 0, 1, 0),
					ZIndex: 2,
				}}
			>
				<uilistlayout
					FillDirection={Enum.FillDirection.Vertical}
					HorizontalAlignment={Enum.HorizontalAlignment.Center}
					Padding={new UDim(0, 0.03)}
					SortOrder={Enum.SortOrder.LayoutOrder}
					VerticalAlignment={Enum.VerticalAlignment.Center}
				/>
				{[...bonusMap].map(([key, value]) => {
					return (
						<TextLabel
							key={tostring(key)}
							Native={{
								Size: new UDim2(1, 0, 0.25, 0),
								TextScaled: true,
							}}
							StrokeSize={rem(2, "pixel")}
							Text={`${key}: ${value}`}
							TextColor={palette.white}
						/>
					);
				})}

				<HatchingCD maxTime={hatchLeftTime} placedTime={placedTime} />

				<TextLabel
					Native={{
						Size: new UDim2(1, 0, 0.25, 0),
						TextScaled: true,
					}}
					StrokeSize={rem(2, "pixel")}
					Text={eggMutations.join(" ")}
					TextColor={palette.white}
				/>
			</Frame>
		</Frame>
	);
}
