import { Flamework, Modding } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import Log from "@rbxts/log";

import { type Configs, configs } from "shared/configs";
import { GAME_NAME } from "shared/constants";
import { setupLogger } from "shared/functions/setup-logger";

import type { RootStore } from "./store";
import { store } from "./store";
import { disableNativeInventory } from "./ui/functions/disble-inventory";
import { createApp, reactConfig } from "./ui/react-config";

function start(): void {
	reactConfig();
	setupLogger();

	Log.Info(`${GAME_NAME} client version: ${game.PlaceVersion}`);

	Modding.registerDependency<Logger>(ctor => Log.ForContext(ctor));
	Modding.registerDependency<RootStore>(() => store);
	Modding.registerDependency<Configs>(() => configs);

	Flamework.addPaths("src/client/controllers");

	Log.Info("Flamework ignite!");
	Flamework.ignite();

	disableNativeInventory();
	createApp().catch(() => {
		Log.Fatal("Failed to create React app!");
	});
}

start();
