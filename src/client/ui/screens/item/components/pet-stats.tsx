import { useTimer } from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";
import { Workspace } from "@rbxts/services";

import { palette, USER_ID } from "client/constants";
import { Frame, TextLabel } from "client/ui/components/primitive";
import { Shadow } from "client/ui/components/primitive/shadow";
import { useRem } from "client/ui/hooks";
import { generateColorSequence } from "client/utils/color-utils";
import { selectPlacedItemById } from "shared/store/players/selectors";
import { ItemType } from "shared/types";
import { calculateEarnings } from "shared/util/calculate-utils/earning";

interface PetStatsProps {
	/** 假设这是从某处获取的稀有度. */
	instanceId: string;
}

export function PetStats(props: PetStatsProps): React.ReactNode {
	const rem = useRem();
	const timer = useTimer();
	const { instanceId } = props;
	const placedPet = useSelector(selectPlacedItemById(USER_ID, instanceId));
	if (!placedPet || placedPet.itemType !== ItemType.Pet) {
		return undefined;
	}

	/** 假设这是从某处获取的稀有度. */
	const rarity = "Common";
	const coinLabelGradient = generateColorSequence([palette.peach, Color3.fromRGB(0, 255, 0)]);
	const rarityGradient = generateColorSequence([palette.white, palette.subtext0]);

	const { currentEarning, earningTime, placedTime } = placedPet;

	// 这里可以根据宠物的属性来计算金币产出等信息
	const earning = timer.value.map(() => {
		// 假设每秒产出10金币
		const lastClaim = math.max(earningTime, placedTime);
		const current = Workspace.GetServerTimeNow();
		const seconds = math.floor(math.clamp(current - lastClaim, 0, current - placedTime));
		const earningPerSecond = calculateEarnings(6, 1, 1);
		return `$${math.floor(earningPerSecond * seconds) + currentEarning}`;
	});

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
				<TextLabel
					Native={{
						key: "rarity-label",
						Size: new UDim2(1, 0, 0.25, 0),
						TextScaled: true,
					}}
					StrokeSize={rem(2, "pixel")}
					Text={rarity}
					TextColor={palette.white}
				>
					<uigradient Color={rarityGradient} Rotation={20} />
				</TextLabel>

				<Frame
					Native={{
						BackgroundColor3: palette.black,
						BackgroundTransparency: 0,
						ClipsDescendants: true,
						Size: new UDim2(1, 0, 0.3, 0),
					}}
				>
					<uigradient
						Transparency={
							new NumberSequence([
								new NumberSequenceKeypoint(0, 1),
								new NumberSequenceKeypoint(0.5, 0.5),
								new NumberSequenceKeypoint(1, 1),
							])
						}
					/>
					<TextLabel
						Native={{
							key: "earn-label",
							Size: new UDim2(1, 0, 1, 0),
							TextScaled: true,
						}}
						StrokeSize={rem(2, "pixel")}
						Text={earning}
						TextColor={palette.white}
					>
						<uigradient Color={coinLabelGradient} Rotation={90} />
					</TextLabel>
				</Frame>

				<TextLabel
					Native={{
						key: "earn-label",
						Size: new UDim2(1, 0, 0.25, 0),
						TextScaled: true,
					}}
					StrokeSize={rem(2, "pixel")}
					Text="$6/s"
					TextColor={palette.white}
				/>
			</Frame>
		</Frame>
	);
}
