import { StarterGui } from "@rbxts/services";

import coreCall from "shared/util/core-call";

/** 禁用 Roblox 原生背包和道具栏. 防止与自定义 UI 系统冲突. */
export function disableNativeInventory(): void {
	// 禁用原生背包 GUI
	coreCall("SetCoreGuiEnabled", Enum.CoreGuiType.Backpack, false);

	// 禁用原生道具栏（底部快捷栏）
	coreCall("SetCoreGuiEnabled", Enum.CoreGuiType.PlayerList, false);

	// 可选：也可以禁用其他原生 GUI 元素
	// coreCall("SetCoreGuiEnabled", Enum.CoreGuiType.Chat, false);
	// coreCall("SetCoreGuiEnabled", Enum.CoreGuiType.Health, false);

	// 确保玩家无法通过快捷键打开背包
	StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);
}
