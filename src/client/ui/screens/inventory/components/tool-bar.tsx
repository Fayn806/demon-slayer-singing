import React, { useEffect } from "@rbxts/react";
import { useSelector } from "@rbxts/react-reflex";

import { USER_ID } from "client/constants";
import { InputCapture } from "client/ui/components/input-capture";
import { Frame } from "client/ui/components/primitive";
import { useRem } from "client/ui/hooks";
import { remotes } from "shared/remotes";
import { selectHeldItemIndex, selectToolBarItems } from "shared/store/players/selectors";
import type { PlayerInventoryItem } from "shared/types";

import { ItemCard } from "./item-card";

export function ToolBar(): React.ReactNode {
	const rem = useRem();
	const toolBarItems = useSelector(selectToolBarItems(USER_ID));
	const heldItemIndex = useSelector(selectHeldItemIndex(USER_ID));

	const onItemClick = (item: PlayerInventoryItem): void => {
		print(`Clicked on item: ${item.itemType}`);
		remotes.plot.switchHeldItemInstanceId
			.request(item.instanceId)
			.andThen(() => {
				// 处理成功
				print(`Successfully switched held item to ${item.instanceId}`);
			})
			.catch(() => {
				// 处理错误
				print(`Failed to switch held item to ${item.instanceId}`);
			});
	};

	useEffect(() => {
		// 这里可以添加一些副作用，比如监听物品变化等
	}, [toolBarItems, heldItemIndex]);

	return (
		<Frame
			Native={{
				AnchorPoint: new Vector2(0.5, 1),
				BackgroundTransparency: 1,
				Position: new UDim2(0.5, 0, 1, -rem(1.5)),
				Size: new UDim2(0, 0, 0, rem(7)),
			}}
		>
			<InputCapture
				onInputBegan={(_, input) => {
					// 按下波浪键时切换背包的显示状态
					if (input.UserInputType !== Enum.UserInputType.Keyboard) {
						return;
					}

					// 1-9 49-57
					const key = input.KeyCode.Value;
					if (key >= 49 && key <= 57) {
						/** 0-8. */
						const index = key - 49;
						if (index < toolBarItems.size()) {
							const item = toolBarItems[index];
							if (item) {
								onItemClick(item);
							}
						}
					}
				}}
			/>
			<uilistlayout
				FillDirection="Horizontal"
				HorizontalAlignment="Center"
				Padding={new UDim(0, rem(0.5))}
				SortOrder="LayoutOrder"
				VerticalAlignment="Center"
			/>
			{toolBarItems.map((item, index) => {
				return (
					<ItemCard
						key={item.instanceId}
						held={heldItemIndex === index}
						layoutOrder={index}
						onClick={() => {
							onItemClick(item);
						}}
					/>
				);
			})}
		</Frame>
	);
}
