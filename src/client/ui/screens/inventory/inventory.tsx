/* eslint-disable @cspell/spellchecker -- Disable spell checking for this file due to Roblox-specific terms and APIs */
import React, { useState } from "@rbxts/react";

import { InputCapture } from "client/ui/components/input-capture";

import { ItemInventory } from "./components/item-inventory";
import { ToolBar } from "./components/tool-bar";

export function Inventory(): React.ReactNode {
	const [inventoryOpen, setInventoryOpen] = useState(false);
	return (
		<>
			<InputCapture
				onInputBegan={(_, input) => {
					// 按下波浪键时切换背包的显示状态
					if (
						input.UserInputType === Enum.UserInputType.Keyboard &&
						input.KeyCode === Enum.KeyCode.Backquote
					) {
						setInventoryOpen(previous => !previous);
					}
				}}
			/>
			{inventoryOpen && <ItemInventory />}
			<ToolBar />
		</>
	);
}
