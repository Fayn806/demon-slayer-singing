import { BaseComponent, Component } from "@flamework/components";
import { Janitor } from "@rbxts/janitor";
import type { Logger } from "@rbxts/log";

import { $NODE_ENV } from "rbxts-transform-env";
import { Tag } from "types/enum/tag";
import type { PlayerAttributes, PlayerModel } from "types/interfaces/components/player";

@Component({
	refreshAttributes: $NODE_ENV === "development",
	tag: Tag.Player,
})
export class PlayerComponent extends BaseComponent<PlayerAttributes, PlayerModel> {
	private readonly janitor = new Janitor();

	constructor(private readonly logger: Logger) {
		super();
	}

	/** @ignore */
	public destroy(): void {
		this.logger.Verbose(`Player ${this.instance.GetFullName()} has been destroyed.`);
		this.janitor.Destroy();
		super.destroy();
	}
}
