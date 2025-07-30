import { BaseComponent, Component } from "@flamework/components";
import { Janitor } from "@rbxts/janitor";
import type { Logger } from "@rbxts/log";

import type { RootStore } from "client/store";
import { $NODE_ENV } from "rbxts-transform-env";
import { Tag } from "types/enum/tag";
import type { PlacedEggAttributes, PlacedEggModel } from "types/interfaces/components/placed-egg";

import type { PlotComponent } from "./plot-component";

@Component({
	refreshAttributes: $NODE_ENV === "development",
	tag: Tag.PlacedEgg,
})
export class PlacedEggComponent extends BaseComponent<PlacedEggAttributes, PlacedEggModel> {
	private readonly janitor = new Janitor();

	private plotComponent: PlotComponent | undefined;

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
	) {
		super();
	}

	public initialize(plotComponent: PlotComponent): void {
		this.plotComponent = plotComponent;
	}

	/** @ignore */
	public destroy(): void {
		this.logger.Verbose(`PlacedEgg ${this.instance.GetFullName()} has been destroyed.`);
		this.janitor.Destroy();
		super.destroy();
	}
}
