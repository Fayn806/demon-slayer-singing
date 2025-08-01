import { Flamework, Modding } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import Log from "@rbxts/log";

import { type Configs, configs } from "shared/configs";
import { GAME_NAME } from "shared/constants";
import { setupLogger } from "shared/functions/setup-logger";

import type { RootStore } from "./store";
import { store } from "./store";

function start(): void {
	setupLogger();

	Log.Info(`${GAME_NAME} is starting up! Version: ${game.PlaceVersion}`);

	Modding.registerDependency<Logger>(ctor => Log.ForContext(ctor));
	Modding.registerDependency<RootStore>(() => store);
	Modding.registerDependency<Configs>(() => configs);

	Flamework.addPaths("src/server/services");

	Log.Info("Flamework ignite!");
	Flamework.ignite();
}

start();
