import type { Components } from "@flamework/components";
import { Controller, type OnStart } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Players, Workspace } from "@rbxts/services";

import { store } from "client/store";
import { selectAllPlayerPlots, selectPlayerPlot } from "shared/store/players/selectors";
import type { PlayerPlotState } from "shared/store/players/types";
import { type ListenerData, setupLifecycle } from "shared/util/flamework-util";
import { waitForPlotStructure } from "shared/util/plot-util";

import type { PlotComponent } from "./plot-component";

export interface OnPlayerPlotLoaded {
	onPlayerPlotLoaded(playerId: string, plot: PlayerPlotState): void;
}

@Controller({})
export class PlotController implements OnStart {
	private readonly plotComponents = new Map<string, PlotComponent>();
	private readonly plotLoadEvents = new Array<ListenerData<OnPlayerPlotLoaded>>();

	constructor(
		private readonly logger: Logger,
		private readonly components: Components,
	) {}

	public onStart(): void {
		setupLifecycle<OnPlayerPlotLoaded>(this.plotLoadEvents);

		for (const player of Players.GetPlayers()) {
			const playerId = tostring(player.UserId);
			const playerPlotState = store.getState(selectPlayerPlot(playerId));
			if (playerPlotState) {
				this.initializePlot(playerId, playerPlotState);
			} else {
				this.logger.Info(
					`Plot state not yet available for player ${playerId}, will wait for sync.`,
				);
			}
		}

		// 监听所有地块状态变化
		store.subscribe(selectAllPlayerPlots, plots => {
			for (const plot of plots) {
				const { playerId } = plot;
				if (!this.plotComponents.has(playerId)) {
					this.logger.Info(`Initializing plot for player ${playerId}.`);
					this.initializePlot(playerId, plot);
				}
			}
		});
	}

	public getPlotComponent(playerId: string): PlotComponent | undefined {
		return this.plotComponents.get(playerId);
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

				this.plotComponents.set(playerId, component);

				for (const { event } of this.plotLoadEvents) {
					event.onPlayerPlotLoaded(playerId, plot);
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
