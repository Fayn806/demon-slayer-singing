import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Workspace } from "@rbxts/services";

import { USER_ID } from "client/constants";
import type { RootStore } from "client/store";
import { selectHeldItem, selectPlayerPlotIndex } from "shared/store/players/selectors";
import type { PlayerPlotState } from "shared/store/players/types";
import { ItemType, type PlayerInventoryItem } from "shared/types";

import type { MouseController } from "../mouse-controller";
import type { OnPlayerPlotLoaded } from "./plot-controller";

@Controller({})
export class PlaceItemController implements OnPlayerPlotLoaded {
	private playerPlacedItemFolder: Folder | undefined;

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly mouseController: MouseController,
	) {}

	/** @ignore */
	public onPlayerPlotLoaded(playerId: string, plot: PlayerPlotState): void {
		this.logger.Info(
			`EggController initialized for player ${playerId} on plot ${plot.islandId} at index ${plot.index}.`,
		);

		if (playerId !== USER_ID) {
			return;
		}

		this.store.subscribe(selectHeldItem(playerId), heldItem => {
			if (heldItem) {
				if (heldItem.itemType !== ItemType.Hammer) {
					this.heldItemHandler(heldItem);
				} else {
					this.logger.Warn(`Unhandled held item type: ${heldItem.itemType}`);
				}
			} else {
				this.cleanupHeldItem();
			}
		});
	}

	private getPlayerPlacedItemFolder(): Folder | undefined {
		if (this.playerPlacedItemFolder !== undefined) {
			return this.playerPlacedItemFolder;
		}

		const playerIndex = this.store.getState(selectPlayerPlotIndex(USER_ID));
		const plotFolder = Workspace.Main.Plots.FindFirstChild(tostring(playerIndex));
		if (!plotFolder) {
			this.logger.Warn(`Plot folder not found for player index ${playerIndex}.`);
			return undefined;
		}

		const placedItemFolder = plotFolder.FindFirstChild("Items");
		if (!placedItemFolder) {
			this.logger.Warn(
				`Items folder not found in plot folder for player index ${playerIndex}.`,
			);
			return undefined;
		}

		this.playerPlacedItemFolder = placedItemFolder as Folder;
		return this.playerPlacedItemFolder;
	}

	private getPlacedItemsData(): Array<{
		instanceId: string;
		position: Vector3;
		range: number;
	}> {
		return [];
	}

	private heldItemHandler(heldItem: PlayerInventoryItem | undefined): void {
		if (!heldItem) {
			this.logger.Warn("No held item found.");
			return;
		}

		this.logger.Info(`Handling held item: ${heldItem.instanceId} of type ${heldItem.itemType}`);

		this.mouseController.onTargetChanged(target => {
			if (target) {
				this.logger.Info(`Mouse target changed to: ${target.instance.Name}`);
				// 处理鼠标目标逻辑
			} else {
				this.logger.Warn("Mouse target is undefined.");
			}
		});
	}

	private cleanupHeldItem(): void {
		this.logger.Info("Cleaning up held item.");
		// 清理手持物品逻辑
	}
}
