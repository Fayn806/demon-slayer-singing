import { hoarcekat } from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";

import { USER_ID } from "client/constants";
import { store } from "client/store";
import { RemProvider } from "client/ui/providers/rem-provider";
import { remotes } from "shared/remotes";
import { EggMutation, type PlayerEgg } from "shared/types";

import { Inventory } from "./inventory";

export = hoarcekat(() => {
	store.playerJoined(USER_ID);
	store.switchIsland(USER_ID, "island1");
	// 这里可以使用hooks来测试
	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg1",
		instanceId: EggMutation.Normal + "_Egg1",
		itemType: "egg",
		mutations: [EggMutation.Normal],
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg1",
		instanceId: EggMutation.Normal + "_Egg1",
		itemType: "egg",
		mutations: [EggMutation.Normal],
	} as PlayerEgg);

	remotes.plot.switchHeldItemInstanceId.test.handleRequest(itemInstanceId => {
		const currentState = store.getState();
		const playerState = currentState.players[USER_ID];
		if (!playerState) {
			print(`Player ${USER_ID} not found`);
			return false;
		}

		const currentIslandId = playerState.plot.islandId;
		const item = playerState.islands[currentIslandId]?.inventory.find(
			inventoryItem => inventoryItem.instanceId === itemInstanceId,
		);

		if (!item) {
			print(`Item with instanceId ${itemInstanceId} not found`);
			return false;
		}

		store.setHeldItem(USER_ID, item);
		print(`Switched held item to ${item.itemType}`);
		return true;
	});

	return (
		<RemProvider key="rem-provider">
			<ReflexProvider key="reflex-provider" producer={store}>
				<Inventory />
			</ReflexProvider>
		</RemProvider>
	);
});
