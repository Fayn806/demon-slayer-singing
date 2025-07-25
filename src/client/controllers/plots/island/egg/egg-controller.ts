/**
 * EggController.ts This file is part of the Roblox TS project template. It is
 * used to manage the egg-related functionality in the client.
 * 这个模块仅用作传送带蛋的控制器，负责处理与蛋相关的逻辑。 负责处理所有玩家传送带蛋的渲染，和本地玩家的传送带蛋的逻辑。.
 *
 * @module EggController
 */

import type { OnStart } from "@flamework/core";
import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { CollectionService, ReplicatedStorage, Workspace } from "@rbxts/services";

import { USER_ID } from "client/constants";
import type { RootStore } from "client/store";
import { selectLatestConveyorEgg } from "shared/store/players/selectors";
import type { ConveyorEgg } from "shared/types";
import { Tag } from "types/enum/tag";

@Controller({})
export class EggController implements OnStart {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
	) {}

	/** @ignore */
	public onStart(): void {
		this.logger.Info("EggController has started.");
		this.store.subscribe(selectLatestConveyorEgg(USER_ID), egg => {
			this.logger.Verbose(`Latest conveyor egg for user ${USER_ID}: ${egg}`);
			this.createEggModel(USER_ID, egg);
		});
	}

	private createEggModel(playerId: string, egg: ConveyorEgg | undefined): Model {
		if (!egg) {
			this.logger.Warn("No egg data available to create model.");
			return new Instance("Model");
		}

		const eggModel = ReplicatedStorage.Assets.Eggs.FindFirstChild(egg.eggId);
		if (!eggModel) {
			this.logger.Warn(`Egg model not found for egg ID: ${egg.eggId}`);
			return new Instance("Model");
		}

		const eggInstance = eggModel.Clone() as Model;

		CollectionService.AddTag(eggInstance, Tag.Egg);
		eggInstance.SetAttribute("instanceId", egg.instanceId);
		eggInstance.SetAttribute("playerId", playerId);

		eggInstance.Parent = Workspace;
		return eggInstance;
	}
}
