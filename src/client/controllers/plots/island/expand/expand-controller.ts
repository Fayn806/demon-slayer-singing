import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";

import type { RootStore } from "client/store";
import type { PlayerPlotState } from "shared/store/players/types";

import type { OnPlayerPlotLoaded } from "../../plot-controller";

@Controller({})
export class ExpandController implements OnPlayerPlotLoaded {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
	) {}

	public onPlayerPlotLoaded(playerId: string, plot: PlayerPlotState): void {
		this.logger.Info(`Player ${playerId} plot loaded: ${plot.index}`);
	}
}
