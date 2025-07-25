import { BaseComponent, Component } from "@flamework/components";
import { Janitor } from "@rbxts/janitor";
import type { Logger } from "@rbxts/log";

import { $NODE_ENV } from "rbxts-transform-env";
import { Tag } from "types/enum/tag";
import type { PlotAttributes, PlotFolder } from "types/interfaces/components/plot";

@Component({
	refreshAttributes: $NODE_ENV === "development",
	tag: Tag.Plot,
})
export class PlotComponent extends BaseComponent<PlotAttributes, PlotFolder> {
	private readonly janitor = new Janitor();

	constructor(private readonly logger: Logger) {
		super();
	}

	/** @ignore */
	public destroy(): void {
		this.logger.Verbose(`Plot ${this.instance.GetFullName()} has been destroyed.`);
		this.janitor.Destroy();
		super.destroy();
	}
}
