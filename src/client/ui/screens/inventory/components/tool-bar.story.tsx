import { hoarcekat } from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";

import { USER_ID } from "client/constants";
import { store } from "client/store";
import { RemProvider } from "client/ui/providers/rem-provider";
import { remotes } from "shared/remotes";
import { ItemType, type PlayerHammer } from "shared/types";

import { ToolBar } from "./tool-bar";

export = hoarcekat(() => {
	store.playerJoined(USER_ID);
	store.switchIsland(USER_ID, "island1");

	store.setHeldItem(USER_ID, {
		hammerId: "hammer2",
		instanceId: "hammer2",
		itemType: ItemType.Hammer,
		uses: 0,
	} as PlayerHammer);

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
				<ToolBar />
			</ReflexProvider>
		</RemProvider>
	);
});
