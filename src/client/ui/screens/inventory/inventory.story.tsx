import { hoarcekat } from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";

import { USER_ID } from "client/constants";
import { store } from "client/store";
import { RemProvider } from "client/ui/providers/rem-provider";
import { remotes } from "shared/remotes";
import { EggType, type PlayerEgg } from "shared/types";

import { Inventory } from "./inventory";

export = hoarcekat(() => {
	store.playerJoined(USER_ID);
	store.switchIsland(USER_ID, "island1");
	// 这里可以使用hooks来测试
	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg1",
		instanceId: EggType.Normal + "_Egg1",
		itemType: "egg",
		type: EggType.Normal,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg1",
		instanceId: EggType.Normal + "_Egg1",
		itemType: "egg",
		type: EggType.Normal,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg1",
		instanceId: EggType.Normal + "_Egg1",
		itemType: "egg",
		type: EggType.Normal,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg2",
		instanceId: EggType.Normal + "_Egg2",
		itemType: "egg",
		type: EggType.Normal,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg3",
		instanceId: EggType.Normal + "_Egg3",
		itemType: "egg",
		type: EggType.Normal,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg4",
		instanceId: EggType.Normal + "_Egg4",
		itemType: "egg",
		type: EggType.Normal,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg5",
		instanceId: EggType.Normal + "_Egg5",
		itemType: "egg",
		type: EggType.Normal,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg6",
		instanceId: EggType.Normal + "_Egg6",
		itemType: "egg",
		type: EggType.Normal,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg7",
		instanceId: EggType.Normal + "_Egg7",
		itemType: "egg",
		type: EggType.Normal,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg8",
		instanceId: EggType.Normal + "_Egg8",
		itemType: "egg",
		type: EggType.Normal,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg1",
		instanceId: EggType.Golden + "_Egg1",
		itemType: "egg",
		type: EggType.Golden,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg1",
		instanceId: EggType.Golden + "_Egg1",
		itemType: "egg",
		type: EggType.Golden,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg2",
		instanceId: EggType.Golden + "_Egg2",
		itemType: "egg",
		type: EggType.Golden,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg3",
		instanceId: EggType.Golden + "_Egg3",
		itemType: "egg",
		type: EggType.Golden,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg4",
		instanceId: EggType.Golden + "_Egg4",
		itemType: "egg",
		type: EggType.Golden,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg5",
		instanceId: EggType.Golden + "_Egg5",
		itemType: "egg",
		type: EggType.Golden,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg6",
		instanceId: EggType.Golden + "_Egg6",
		itemType: "egg",
		type: EggType.Golden,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg7",
		instanceId: EggType.Golden + "_Egg7",
		itemType: "egg",
		type: EggType.Golden,
	} as PlayerEgg);

	store.addItemToInventory(USER_ID, {
		count: 1,
		eggId: "Egg8",
		instanceId: EggType.Golden + "_Egg8",
		itemType: "egg",
		type: EggType.Golden,
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
