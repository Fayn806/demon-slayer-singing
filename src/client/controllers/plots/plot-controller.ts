import type { Components } from "@flamework/components";
import { Controller, type OnStart } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Workspace } from "@rbxts/services";

import { USER_ID } from "client/constants";
import { store } from "client/store";
import { selectPlayerPlot } from "shared/store/players/selectors";
import type { PlayerPlotState } from "shared/store/players/types";
import { type ListenerData, setupLifecycle } from "shared/util/flamework-util";
import { waitForPlotStructure } from "shared/util/plot-util";

import type { PlotComponent } from "./plot-component";

export interface OnPlayerPlotLoaded {
	onPlayerPlotLoaded(playerId: string, plot: PlayerPlotState, component: PlotComponent): void;
}

@Controller({})
export class PlotController implements OnStart {
	private readonly plotComponents = new Map<string, Folder>();
	private readonly plotLoadEvents = new Array<ListenerData<OnPlayerPlotLoaded>>();

	constructor(
		private readonly logger: Logger,
		private readonly components: Components,
	) {}

	public onStart(): void {
		setupLifecycle<OnPlayerPlotLoaded>(this.plotLoadEvents);

		const playerPlotState = store.getState(selectPlayerPlot(USER_ID));
		if (playerPlotState) {
			this.initializePlot(USER_ID, playerPlotState);
		}

		store.subscribe(selectPlayerPlot(USER_ID), plot => {
			this.initializePlot(USER_ID, plot);
		});
	}

	private initializePlot(playerId: string, plot: PlayerPlotState | undefined): void {
		if (!plot) {
			this.logger.Warn(`No plot found for player ${playerId}.`);
			return;
		}

		const plotFolder = Workspace.Main.Plots.FindFirstChild(tostring(plot.index));
		if (!plotFolder) {
			this.logger.Warn(`Plot folder not found for player index: ${plot.index}`);
			return;
		}

		waitForPlotStructure(plotFolder as Folder)
			.then(isReady => {
				if (!isReady) {
					this.logger.Error(`Plot structure for player ${playerId} is not ready.`);
					return;
				}

				this.logger.Info(`Plot structure for player ${playerId} is ready.`);

				const component = this.createPlotComponent(
					playerId,
					plot.index,
					plotFolder as Folder,
				);
				if (!component) {
					this.logger.Error(`Failed to create plot component for player ${playerId}.`);
					return;
				}

				for (const { event } of this.plotLoadEvents) {
					event.onPlayerPlotLoaded(playerId, plot, component);
				}
			})
			.catch(err => {
				this.logger.Error(
					`Error waiting for plot structure for player ${playerId}: ${err}`,
				);
			});
	}

	private createPlotComponent(
		playerId: string,
		plotIndex: number,
		plotFolder: Folder,
	): PlotComponent | undefined {
		if (this.plotComponents.has(playerId)) {
			this.logger.Warn(`Plot component already exists for player ${playerId}.`);
			return;
		}

		plotFolder.SetAttribute("playerId", playerId);
		plotFolder.SetAttribute("plotIndex", plotIndex);

		return this.components.addComponent<PlotComponent>(plotFolder);
	}
}
