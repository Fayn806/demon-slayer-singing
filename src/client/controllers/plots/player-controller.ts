import type { OnStart } from "@flamework/core";
import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";

import type { RootStore } from "client/store";
import type { PlayerPlotState } from "shared/store/players/types";

import type { OnPlayerPlotLoaded } from "./plot-controller";

@Controller({})
export class PlayerController implements OnStart, OnPlayerPlotLoaded {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
	) {}

	/** @ignore */
	public onStart(): void {}

	public onPlayerPlotLoaded(playerId: string, plot: PlayerPlotState): void {}
}
