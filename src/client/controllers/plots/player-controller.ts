import type { OnStart } from "@flamework/core";
import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";

import { LocalPlayer } from "client/constants";
import type { RootStore } from "client/store";
import { selectHeldItem } from "shared/store/players/selectors";
import type { PlayerPlotState } from "shared/store/players/types";
import { ItemType, type PlayerBooster, type PlayerEgg, type PlayerPet } from "shared/types";

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
				switch (heldItem.itemType) {
					case ItemType.Booster: {
						this.handleHeldBooster(heldItem);

						break;
					}
					case ItemType.Egg: {
						this.handleHeldEgg(heldItem);

						break;
					}
					case ItemType.Hammer: {
						break;
					}
					case ItemType.Pet: {
						this.handleHeldPet(heldItem);

						break;
					}
				}
			} else {
				this.cleanupHeldItem();
			}
		});
	}

	public withPlayerCharacter(
		callback: (character: Model & { PrimaryPart: BasePart }) => void,
	): void {
		const character = LocalPlayer.Character;
		if (!character) {
			this.logger.Warn("Player character not found.");
			return;
		}

		const humanoidRootPart = character.FindFirstChild("HumanoidRootPart");
		if (humanoidRootPart !== undefined && character.PrimaryPart !== undefined) {
			callback(character as Model & { PrimaryPart: BasePart });
		}
	}

	private handleHeldEgg(heldItem: PlayerEgg | undefined): void {
		// 处理蛋逻辑
	}

	private handleHeldPet(heldItem: PlayerPet | undefined): void {
		// 处理宠物逻辑
	}

	private handleHeldBooster(heldItem: PlayerBooster | undefined): void {
		// 处理增益物品逻辑
	}

	private cleanupHeldItem(): void {}
}
