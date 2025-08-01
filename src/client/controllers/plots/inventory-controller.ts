import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";

import type { RootStore } from "client/store";

@Controller({})
export class InventoryController {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
	) {}
}
