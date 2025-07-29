import type { OnStart } from "@flamework/core";
import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";

import type { RootStore } from "client/store";
import { selectHeldItem } from "shared/store/players/selectors";
import type { PlayerPlotState } from "shared/store/players/types";
import { ItemType, type PlayerEgg, type PlayerPet } from "shared/types";

import type { OnPlayerPlotLoaded } from "./plot-controller";

@Controller({})
export class PlayerController implements OnStart, OnPlayerPlotLoaded {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
	) {}

	/** @ignore */
	public onStart(): void {}

	public onPlayerPlotLoaded(playerId: string, plot: PlayerPlotState): void {
		this.store.subscribe(selectHeldItem(playerId), heldItem => {
			if (heldItem) {
				if (heldItem.itemType === ItemType.Egg) {
					this.handleHeldEgg(heldItem);
				} else if (heldItem.itemType === ItemType.Pet) {
					this.handleHeldPet(heldItem);
				} else {
					this.logger.Warn(`Unhandled held item type: ${heldItem.itemType}`);
				}
			} else {
				this.cleanupHeldItem();
			}
		});
	}

	private handleHeldEgg(heldItem: PlayerEgg | undefined): void {
		// 处理蛋逻辑
	}

	private handleHeldPet(heldItem: PlayerPet | undefined): void {
		// 处理宠物逻辑
	}

	private cleanupHeldItem(): void {}
}
