import { BaseComponent, Component } from "@flamework/components";
import { Janitor } from "@rbxts/janitor";
import type { Logger } from "@rbxts/log";
import React from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";

import type { RootStore } from "client/store";
import { PetStatsGui } from "client/ui/screens/item/pet-stats-gui";
import { $NODE_ENV } from "rbxts-transform-env";
import { selectPlacedItemById } from "shared/store/players/selectors";
import CollisionGroup from "types/enum/collision-group";
import { Tag } from "types/enum/tag";
import type { PlacedPetAttributes, PlacedPetModel } from "types/interfaces/components/placed-pet";

import type { PlotComponent } from "./plot-component";

@Component({
	refreshAttributes: $NODE_ENV === "development",
	tag: Tag.PlacedPet,
})
export class PlacedPetComponent extends BaseComponent<PlacedPetAttributes, PlacedPetModel> {
	private readonly guiRoot;
	private readonly janitor = new Janitor();

	private plotComponent: PlotComponent | undefined;

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
	) {
		super();
		this.guiRoot = createRoot(new Instance("Folder"));
	}

	public initialize(plotComponent: PlotComponent): void {
		this.plotComponent = plotComponent;
		// 关闭所有碰撞
		for (const part of this.instance.GetDescendants()) {
			if (part.IsA("BasePart") || part.IsA("MeshPart")) {
				part.CollisionGroup = CollisionGroup.Character;
			}
		}

		this.janitor.Add(
			this.instance.DescendantAdded.Connect(descendant => {
				if (descendant.IsA("BasePart") || descendant.IsA("MeshPart")) {
					descendant.CollisionGroup = CollisionGroup.Character;
				}
			}),
		);

		// 监听状态变化
		// this.setupStateListener();

		this.setupStatsGui();
	}

	/** @ignore */
	public destroy(): void {
		this.instance.Destroy();
		this.guiRoot.unmount();

		this.logger.Verbose(`PlacedPet ${this.instance.GetFullName()} has been destroyed.`);
		this.janitor.Destroy();
		super.destroy();
	}

	private setupStatsGui(): void {
		// 这里可以添加放置宠物的统计信息GUI
		// 例如，显示宠物的名称、等级、经验等
		this.guiRoot.render(
			createPortal(
				<PetStatsGui instanceId={this.attributes.instanceId} />,
				this.instance.PrimaryPart,
			),
		);
	}

	/** 设置状态监听器. */
	private setupStateListener(): void {
		this.janitor.Add(
			this.store.subscribe(
				selectPlacedItemById(this.attributes.playerId, this.attributes.instanceId),
				placedItem => {
					if (!placedItem) {
						this.instance.Destroy();
						return;
					}

					this.logger.Info(
						`Placed item ${this.attributes.instanceId} found for player ${this.attributes.playerId}.`,
					);
				},
			),
		);
	}
}
