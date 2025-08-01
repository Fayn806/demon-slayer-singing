import type { Components } from "@flamework/components";
import { BaseComponent, Component } from "@flamework/components";
import type { OnStart } from "@flamework/core";
import { Janitor } from "@rbxts/janitor";
import type { Logger } from "@rbxts/log";
import { ReplicatedStorage } from "@rbxts/services";

import type { RootStore } from "client/store";
import { $NODE_ENV } from "rbxts-transform-env";
import {
	selectConveyorEggs,
	selectIslandExpansions,
	selectPlacedItems,
	selectPlayerConveyor,
} from "shared/store/players/selectors";
import { ConveyorSpeedMode, type SpeedHistoryEntry } from "shared/store/players/types";
import {
	type ConveyorEgg,
	ItemType,
	type PlacedEgg,
	type PlacedPet,
	type PlayerPlacedItem,
} from "shared/types";
import {
	getPlacementAreaFromPart,
	getRelativePosition,
	getWorldPosition,
	type PlacementArea,
} from "shared/util/location-util";
import { Tag } from "types/enum/tag";
import type { ConveyorEggModel } from "types/interfaces/components/egg";
import type { PlacedEggModel } from "types/interfaces/components/placed-egg";
import type { PlotAttributes, PlotFolder } from "types/interfaces/components/plot";

import type { ConveyorEggComponent } from "./conveyor-egg-component";
import type { PlacedEggComponent } from "./placed-egg-component";
import type { PlacedPetComponent } from "./placed-pet-component";

@Component({
	refreshAttributes: $NODE_ENV === "development",
	tag: Tag.Plot,
})
export class PlotComponent extends BaseComponent<PlotAttributes, PlotFolder> implements OnStart {
	private readonly conveyorEggComponents = new Map<string, ConveyorEggComponent>();
	private readonly janitor = new Janitor();
	private readonly placedItemComponents = new Map<
		string,
		PlacedEggComponent | PlacedPetComponent
	>();
	private readonly placementArea: PlacementArea;

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly components: Components,
	) {
		super();

		this.placementArea = getPlacementAreaFromPart(
			this.instance.Boundary,
			this.instance.Boundary.Position.Y + this.instance.Boundary.Size.Y / 2,
		);
	}

	/** @ignore */
	public onStart(): void {
		this.logger.Info(
			`Plot component started for plot ${this.attributes.plotIndex} (Player: ${this.attributes.playerId})`,
		);

		// 初始化 Plot 系统
		this.initializePlot();
	}

	/** @ignore */
	public destroy(): void {
		this.logger.Verbose(`Plot ${this.instance.GetFullName()} has been destroyed.`);
		this.janitor.Destroy();
		super.destroy();
	}

	/**
	 * 获取当前 Plot 中的所有蛋模型.
	 *
	 * @returns 蛋模型数组.
	 */
	public getEggModels(): Array<ConveyorEggModel> {
		const eggModels: Array<ConveyorEggModel> = [];

		for (const child of this.instance.Eggs.GetChildren()) {
			if (child.IsA("Model")) {
				eggModels.push(child as ConveyorEggModel);
			}
		}

		return eggModels;
	}

	/**
	 * 获取传送带开始位置的 CFrame.
	 *
	 * @returns 传送带开始位置的 CFrame.
	 */
	public getEggMoveStartPosition(): CFrame {
		return this.instance.Conveyor.Spawn.CFrame;
	}

	/**
	 * 获取传送带结束位置的 CFrame.
	 *
	 * @returns 传送带结束位置的 CFrame.
	 */
	public getEggMoveEndPosition(): CFrame {
		return this.instance.Conveyor.Finish.CFrame;
	}

	/**
	 * 获取传送带的速度.
	 *
	 * @returns 传送带速度.
	 */
	public getConveyorSpeed(): ConveyorSpeedMode {
		const conveyorState = this.store.getState(selectPlayerConveyor(this.attributes.playerId));
		return conveyorState?.speedMode ?? ConveyorSpeedMode.Slow;
	}

	/**
	 * 获取传送带的速度历史.
	 *
	 * @returns 传送带速度历史.
	 */
	public getConveyorSpeedHistory(): Array<SpeedHistoryEntry> {
		const conveyorState = this.store.getState(selectPlayerConveyor(this.attributes.playerId));
		return conveyorState?.speedModeHistory ?? [];
	}

	public getRelativePosition(position: Vector3): Vector3 {
		return getRelativePosition(position, this.placementArea);
	}

	public getWorldPosition(relativePosition: Vector3): Vector3 {
		return getWorldPosition(relativePosition, this.placementArea);
	}

	public getPlacementArea(): PlacementArea {
		return this.placementArea;
	}

	/** 初始化 Plot 系统. */
	private initializePlot(): void {
		// 清理可能存在的孤立蛋模型
		this.cleanupOrphanedEggs();

		this.logger.Verbose(`Plot ${this.attributes.plotIndex} initialized successfully`);

		this.initializeConveyorEggs();
		this.initializeExpansions();
		this.initializePlacedItems();
	}

	private initializeConveyorEggs(): void {
		// 监听玩家蛋状态变化
		this.janitor.Add(
			this.store.subscribe(selectConveyorEggs(this.attributes.playerId), eggs => {
				this.updateConveyorEggs(eggs);
			}),
		);
	}

	private initializeExpansions(): void {
		const expansions = this.store.getState(selectIslandExpansions(this.attributes.playerId));
		this.updateExpansions(expansions);

		// 监听玩家扩展状态变化
		this.janitor.Add(
			this.store.subscribe(
				selectIslandExpansions(this.attributes.playerId),
				updatedExpansions => {
					this.updateExpansions(updatedExpansions);
				},
			),
		);
	}

	private initializePlacedItems(): void {
		// 监听玩家已放置物品状态变化
		this.janitor.Add(
			this.store.subscribe(selectPlacedItems(this.attributes.playerId), placedItems => {
				this.updatePlacedItems(placedItems);
			}),
		);
	}

	private updatePlacedItems(placedItems: Array<PlayerPlacedItem>): void {
		// 更新当前 Plot 中的已放置物品
		for (const item of placedItems) {
			const placedItemComponent = this.placedItemComponents.get(item.instanceId);
			if (placedItemComponent) {
				continue;
			}

			this.createPlacedItem(item);
		}

		// 清理已放置物品组件
		for (const [instanceId, component] of pairs(this.placedItemComponents)) {
			if (!placedItems.some(item => item.instanceId === instanceId)) {
				this.logger.Verbose(`Removing placed item component for ${instanceId}`);
				component.destroy();
				this.placedItemComponents.delete(instanceId);
			}
		}
	}

	/**
	 * 创建放置的物品组件.
	 *
	 * @param item - 放置的物品数据.
	 */
	private createPlacedItem(item: PlayerPlacedItem): void {
		if (item.itemType === ItemType.Egg) {
			this.createPlacedEgg(item);
		} else if (item.itemType === ItemType.Pet) {
			this.createPlacedPet(item);
		}
	}

	private createPlacedEgg(item: PlacedEgg): void {
		const eggModel = ReplicatedStorage.Assets.Eggs.FindFirstChild(item.eggId);
		if (!eggModel) {
			this.logger.Warn(`Egg model ${item.eggId} not found`);
			return;
		}

		const clone = eggModel.Clone() as PlacedEggModel;
		clone.SetAttribute("instanceId", item.instanceId);
		clone.SetAttribute("playerId", this.attributes.playerId);
		clone.Parent = this.instance.Items;
		const worldPosition = this.getWorldPosition(item.location.Position);
		clone.PivotTo(new CFrame(worldPosition));

		// 创建 PlacedEggComponent 实例并初始化
		const placedEggComponent = this.components.addComponent<PlacedEggComponent>(clone);
		placedEggComponent.initialize(this);
		this.placedItemComponents.set(item.instanceId, placedEggComponent);
	}

	private createPlacedPet(item: PlacedPet): void {
		const petModel = ReplicatedStorage.Assets.Characters.FindFirstChild(
			"StarterCharacter_" + item.petId,
		);

		if (!petModel) {
			this.logger.Warn(`Pet model for ${item.petId} not found`);
			return;
		}

		const clone = petModel.Clone() as Model;
		clone.SetAttribute("instanceId", item.instanceId);
		clone.SetAttribute("playerId", this.attributes.playerId);
		clone.Parent = this.instance.Items;

		const humanoidRootPart = clone.WaitForChild("HumanoidRootPart", 3) as BasePart | undefined;
		const humanoid = clone.WaitForChild("Humanoid", 3) as Humanoid | undefined;
		// 设置位置和父级
		const yOffset =
			(humanoidRootPart !== undefined ? humanoidRootPart.Size.Y / 2 : 0) +
			(humanoid ? humanoid.HipHeight : 0);

		const worldPosition = this.getWorldPosition(item.location.Position);

		humanoid?.Destroy();

		clone.PivotTo(new CFrame(worldPosition).mul(new CFrame(0, yOffset, 0)));

		if (clone.PrimaryPart) {
			clone.PrimaryPart.Anchored = true;
		}
		// 创建 PlacedEggComponent 实例并初始化

		const placedPetComponent = this.components.addComponent<PlacedPetComponent>(clone);
		placedPetComponent.initialize(this);
		this.placedItemComponents.set(item.instanceId, placedPetComponent);
	}

	/** 清理孤立的蛋模型（没有对应状态的蛋）. */
	private cleanupOrphanedEggs(): void {
		// 这里可以添加逻辑来检查 store 中的状态
		// 如果蛋模型在文件夹中但不在状态中，则清理它们

		// 暂时的实现：记录当前存在的蛋
		const currentEggs = this.getEggModels();
		this.logger.Verbose(
			`Plot ${this.attributes.plotIndex} has ${currentEggs.size()} existing eggs`,
		);
	}

	private updateConveyorEggs(eggs: Array<ConveyorEgg>): void {
		// 更新当前 Plot 中的蛋模型
		for (const egg of eggs) {
			const eggComponent = this.conveyorEggComponents.get(egg.instanceId);
			if (eggComponent) {
				continue;
			}

			this.createConveyorEgg(egg);
		}

		// 清理已放置物品组件
		for (const [instanceId, component] of pairs(this.conveyorEggComponents)) {
			if (!eggs.some(item => item.instanceId === instanceId)) {
				this.logger.Verbose(`Removing conveyor egg component for ${instanceId}`);
				component.destroy();
				this.conveyorEggComponents.delete(instanceId);
			}
		}
	}

	private createConveyorEgg(egg: ConveyorEgg): void {
		const eggModel = ReplicatedStorage.Assets.Eggs.FindFirstChild(egg.eggId);
		if (!eggModel) {
			this.logger.Warn(`Egg model ${egg.eggId} not found`);
			return;
		}

		const clone = eggModel.Clone() as ConveyorEggModel;
		clone.SetAttribute("instanceId", egg.instanceId);
		clone.SetAttribute("playerId", this.attributes.playerId);
		clone.Parent = this.instance.Eggs;

		// 创建 ConveyorEggComponent 实例并初始化
		const conveyorEggComponent = this.components.addComponent<ConveyorEggComponent>(clone);
		conveyorEggComponent.initialize(this);
		this.conveyorEggComponents.set(egg.instanceId, conveyorEggComponent);
	}

	private updateExpansions(expansions: Record<string, boolean>): void {
		for (const [expansionId, unlocked] of pairs(expansions)) {
			if (unlocked) {
				this.setExpansionExpanded(expansionId, true);
				this.logger.Info(
					`Player ${this.attributes.playerId} unlocked expansion: ${expansionId}`,
				);
			}
		}
	}

	private setExpansionExpanded(expansionId: string, isExpanded: boolean): void {
		const reserve = ReplicatedStorage.ExpandReserve.FindFirstChild(
			this.attributes.plotIndex,
		) as Folder;
		const before = isExpanded ? this.instance.Expand : reserve;
		const after = isExpanded ? reserve : this.instance.Expand;

		const expansionModel = before.FindFirstChild(expansionId);
		if (!expansionModel) {
			return;
		}

		expansionModel.Parent = after;
	}
}
