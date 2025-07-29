import React from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";

import { palette, USER_ID } from "client/constants";
import { Frame, Group, ScrollingFrame } from "client/ui/components/primitive";
import { Outline } from "client/ui/components/primitive/outline";
import { Shadow } from "client/ui/components/primitive/shadow";
import { useRem } from "client/ui/hooks";
import { remotes } from "shared/remotes";
import { selectHeldItemIndex, selectInventoryExtraItems } from "shared/store/players/selectors";
import type { PlayerInventoryItem } from "shared/types";

import { ItemCard } from "./item-card";

export function ItemInventory(): React.ReactNode {
	const rem = useRem();
	const inventoryItems = useSelector(selectInventoryExtraItems(USER_ID));
	const heldItemIndex = useSelector(selectHeldItemIndex(USER_ID));

	const onItemClick = (item: PlayerInventoryItem): void => {
		print(`Clicked on item: ${item.itemType}`);
		remotes.plot.switchHeldItemInstanceId
			.request(item.instanceId)
			.andThen(() => {
				// 处理成功
				print(`Successfully switched held item to ${item.itemType}`);
			})
			.catch(() => {
				// 处理错误
				print(`Failed to switch held item to ${item.itemType}`);
			});
	};

	return (
		<Frame
			Native={{
				AnchorPoint: new Vector2(0.5, 1),
				BackgroundTransparency: 1,
				Position: new UDim2(0.5, 0, 1, -rem(1.5 + 6.5 + 1)),
				Size: new UDim2(0, rem(46), 0, rem(27)),
			}}
		>
			<Shadow
				ShadowBlur={0.1}
				ShadowColor={palette.base}
				ShadowPosition={0}
				ShadowSize={rem(50)}
				ShadowTransparency={0.6}
			/>

			<Frame
				CornerRadius={new UDim(0, rem(0.5))}
				Native={{
					BackgroundColor3: palette.base,
					BackgroundTransparency: 0.8,
					BorderSizePixel: 0,
				}}
			/>

			<Outline
				CornerRadius={new UDim(0, rem(0.5))}
				InnerColor={palette.white}
				InnerThickness={rem(2, "pixel")}
				InnerTransparency={0.3}
				OuterColor={palette.white}
				OuterThickness={rem(2, "pixel")}
				OutlineTransparency={0}
			/>
			<Group>
				<uipadding
					PaddingBottom={new UDim(0, rem(1.5))}
					PaddingLeft={new UDim(0, rem(1.5))}
					PaddingRight={new UDim(0, rem(0.5))}
					PaddingTop={new UDim(0, rem(0.5))}
				/>

				<ScrollingFrame
					CanvasSize={new Vector2()}
					Native={{
						AutomaticCanvasSize: Enum.AutomaticSize.Y,
						HorizontalScrollBarInset: Enum.ScrollBarInset.None,
						ScrollBarImageColor3: palette.white,
						ScrollBarThickness: rem(0.4),
						Size: new UDim2(1, 0, 1, 0),
					}}
				>
					<uilistlayout
						FillDirection={Enum.FillDirection.Horizontal}
						HorizontalAlignment={Enum.HorizontalAlignment.Left}
						Padding={new UDim(0, rem(0.8))}
						SortOrder={Enum.SortOrder.LayoutOrder}
						VerticalAlignment={Enum.VerticalAlignment.Top}
						Wraps={true}
					/>
					<uipadding
						PaddingRight={new UDim(0, rem(1))}
						PaddingTop={new UDim(0, rem(1))}
					/>
					{inventoryItems.map((item, index) => {
						return (
							<ItemCard
								key={item.itemType + index}
								held={heldItemIndex === index + 9}
								onClick={() => {
									onItemClick(item);
								}}
							/>
						);
					})}
				</ScrollingFrame>
			</Group>
		</Frame>
	);
}
