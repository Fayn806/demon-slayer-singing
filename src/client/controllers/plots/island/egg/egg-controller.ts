/**
 * EggController.ts This file is part of the Roblox TS project template. It is
 * used to manage the egg-related functionality in the client.
 * 这个模块仅用作传送带蛋的控制器，负责处理与蛋相关的逻辑。 负责处理所有玩家传送带蛋的渲染，和本地玩家的传送带蛋的逻辑。.
 *
 * @module EggController
 */

import type { Components } from "@flamework/components";
import type { OnStart } from "@flamework/core";
import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { ReplicatedStorage } from "@rbxts/services";

import type { RootStore } from "client/store";
import { selectLatestConveyorEgg } from "shared/store/players/selectors";
import type { PlayerPlotState } from "shared/store/players/types";
import type { ConveyorEgg } from "shared/types";
import type { EggModel } from "types/interfaces/components/egg";

import type { OnPlayerPlotLoaded, PlotController } from "../../plot-controller";

@Controller({})
export class EggController implements OnStart, OnPlayerPlotLoaded {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly components: Components,
		private readonly plotController: PlotController,
	) {}

	/** @ignore */
	public onStart(): void {
		this.logger.Info("EggController has started.");
	}

	public onPlayerPlotLoaded(playerId: string, _plot: PlayerPlotState): void {
		this.logger.Info(`Player ${playerId} plot loaded for EggController.`);
		this.store.subscribe(selectLatestConveyorEgg(playerId), egg => {
			this.logger.Verbose(`Latest conveyor egg for user ${playerId}: ${egg}`);
			this.createConveyorEggModel(playerId, egg);
		});
	}

	private createConveyorEggModel(playerId: string, egg: ConveyorEgg | undefined): void {
		if (!egg) {
			this.logger.Warn("No egg data available to create model.");
			return;
		}

		const eggModel = ReplicatedStorage.Assets.Eggs.FindFirstChild(egg.eggId);
		if (!eggModel) {
			this.logger.Warn(`Egg model not found for egg ID: ${egg.eggId}`);
			return;
		}

		const plotComponent = this.plotController.getPlotComponent(playerId);
		if (!plotComponent) {
			this.logger.Warn(`Plot component not found for player ID: ${playerId}`);
			return;
		}

		const eggClone = eggModel.Clone();
		const created = plotComponent.addEggModel(eggClone as EggModel, playerId, egg.instanceId);
		if (!created) {
			this.logger.Error(`Failed to add egg model ${egg.instanceId} to plot.`);
		}
	}
}
