import { Service } from "@flamework/core";
import type { Logger } from "@rbxts/log";

import type { RootStore } from "server/store";

@Service({})
export class BoosterService {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
	) {}
}
