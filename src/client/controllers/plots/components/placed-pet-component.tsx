import { BaseComponent, Component } from "@flamework/components";
import { Janitor } from "@rbxts/janitor";
import type { Logger } from "@rbxts/log";
import React from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import { Debris, ReplicatedStorage, RunService } from "@rbxts/services";

import { USER_ID } from "client/constants";
import type { RootStore } from "client/store";
import { PetStatsGui } from "client/ui/screens/item/pet-stats-gui";
import { $NODE_ENV } from "rbxts-transform-env";
import { remotes } from "shared/remotes";
import { selectPlacedItemById } from "shared/store/players/selectors";
import type { PlacedPet } from "shared/types";
import CollisionGroup from "types/enum/collision-group";
import { Tag } from "types/enum/tag";
import type { PlacedPetAttributes, PlacedPetModel } from "types/interfaces/components/placed-pet";

import type { PlayerController } from "../player-controller";
import type { PlotComponent } from "./plot-component";
import { calculateEarnings } from "shared/util/calculate-utils/earning";

@Component({
	refreshAttributes: $NODE_ENV === "development",
	tag: Tag.PlacedPet,
})
export class PlacedPetComponent extends BaseComponent<PlacedPetAttributes, PlacedPetModel> {
	private readonly data: PlacedPet;
	private readonly guiRoot;
	private readonly janitor = new Janitor();

	private closeToPlayer = true;
	private plotComponent: PlotComponent | undefined;

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly playerController: PlayerController,
	) {
		super();
		this.guiRoot = createRoot(new Instance("Folder"));
		this.data = store.getState(
			selectPlacedItemById(this.attributes.playerId, this.attributes.instanceId),
		) as PlacedPet;
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

		// 监听玩家角色变化
		this.setupPlayerCharacterListener();
	}

	/** @ignore */
	public destroy(): void {
		this.instance.Destroy();
		this.guiRoot.unmount();

		this.logger.Verbose(`PlacedPet ${this.instance.GetFullName()} has been destroyed.`);
		this.janitor.Destroy();
		super.destroy();
	}

	public getCurrentEarning(): number {
		const placedItem = this.store.getState(
			selectPlacedItemById(this.attributes.playerId, this.attributes.instanceId),
		) as PlacedPet | undefined;

		if (!placedItem) {
			return 0;
		}
		

		const { currentEarning, earningTime } = placedItem;
		const earning = currentEarning + calculateEarnings(6, 1, 1, earningTime);

		return earning;
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

	private setupPlayerCharacterListener(): void {
		if (this.attributes.playerId !== USER_ID) {
			return;
		}

		this.janitor.Add(
			RunService.Heartbeat.Connect(() => {
				this.playerController.withPlayerCharacter(character => {
					if (!this.plotComponent) {
						return;
					}

					const offset = character.PrimaryPart.Position.sub(
						this.instance.PrimaryPart.Position,
					);
					// 忽略y轴
					const distance = new Vector3(offset.X, 0, offset.Z).Magnitude;
					if (distance < 2) {
						if (this.closeToPlayer) {
							return;
						}

						this.handlePlayerClosed(true);
						this.closeToPlayer = true;
					} else {
						if (!this.closeToPlayer) {
							return;
						}

						this.closeToPlayer = false;
					}
				});
			}),
		);
	}

	private handlePlayerClosed(closed: boolean): void {
		if (!this.plotComponent) {
			return;
		}

		if (!closed) {
			return;
		}

		const currentEarning = this.getCurrentEarning();
		if (currentEarning <= 0) {
			this.logger.Warn(
				`No earnings to claim for pet ${this.attributes.instanceId} of player ${USER_ID}.`,
			);
			return;
		}

		remotes.plot
			.claimPetEarings(this.attributes.instanceId)
			.andThen(success => {
				if (success === undefined) {
					this.logger.Warn(
						`Claiming earnings for pet ${this.attributes.instanceId} returned undefined.`,
					);
					return;
				}

				if (success) {
					this.logger.Info(
						`Player ${USER_ID} claimed earnings for pet ${this.attributes.instanceId}.`,
					);
					this.handlePetEarningsClaimed(currentEarning);
				}
			})
			.catch(err => {
				this.logger.Error(
					`Failed to claim earnings for pet ${this.attributes.instanceId}: ${err}`,
				);
			});
	}

	private handlePetEarningsClaimed(currentEarning: number | undefined): void {
		this.showClaimedEffect(currentEarning);
	}

	private showClaimedEffect(currentEarning: number | undefined): void {
		const effectPart = ReplicatedStorage.Assets.Particles.WaitForChild("Collect", 1) as Part | undefined;
		if (!effectPart) {
			this.logger.Warn("Collect effect part not found.");
			return;
		}

		const effectClone = effectPart.Clone();
		effectClone.Parent = this.instance;
		effectClone.Position = this.instance.PrimaryPart.Position;

		for (const descendant of effectClone.GetDescendants()) {
			if (descendant.IsA("ParticleEmitter")) {
				descendant.Emit(15);
			}
		}

		Debris.AddItem(effectClone, 2);
	}
}
