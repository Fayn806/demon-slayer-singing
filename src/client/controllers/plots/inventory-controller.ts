import type { OnStart } from "@flamework/core";
import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";

import { USER_ID } from "client/constants";
import type { RootStore } from "client/store";
import { selectInventoryItems } from "shared/store/players/selectors";

@Controller({})
export class InventoryController implements OnStart {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
	) {}

	/** @ignore */
	public onStart(): void {
		this.logger.Info("InventoryController started.");
		this.store.subscribe(selectInventoryItems(USER_ID), inventoryItems => {
			this.logger.Info(`Inventory updated for user ${USER_ID}`);
			print(inventoryItems);
		});
	}
}
