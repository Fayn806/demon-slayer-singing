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
	selectPlayerConveyor,
} from "shared/store/players/selectors";
import { ConveyorSpeedMode, type SpeedHistoryEntry } from "shared/store/players/types";
import type { ConveyorEgg } from "shared/types";
import { Tag } from "types/enum/tag";
import type { EggModel } from "types/interfaces/components/egg";
import type { PlotAttributes, PlotFolder } from "types/interfaces/components/plot";

import type { ConveyorEggComponent } from "./conveyor-egg-component";

@Component({
	refreshAttributes: $NODE_ENV === "development",
	tag: Tag.Plot,
})
export class PlotComponent extends BaseComponent<PlotAttributes, PlotFolder> implements OnStart {
	private readonly conveyorEggComponents = new Map<string, ConveyorEggComponent>();
	private readonly janitor = new Janitor();

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly components: Components,
	) {
		super();
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
	public getEggModels(): Array<EggModel> {
		const eggModels: Array<EggModel> = [];

		for (const child of this.instance.Eggs.GetChildren()) {
			if (child.IsA("Model")) {
				eggModels.push(child as EggModel);
			}
		}

		return eggModels;
	}

	/**
	 * 根据实例ID查找蛋模型.
	 *
	 * @param eggInstanceId - 蛋的实例ID.
	 * @returns 找到的蛋模型，如果未找到则返回 undefined.
	 */
	public findEggModel(eggInstanceId: string): EggModel | undefined {
		const eggModel = this.instance.Eggs.FindFirstChild(eggInstanceId);
		return eggModel?.IsA("Model") === true ? (eggModel as EggModel) : undefined;
	}

	/** 清空所有蛋模型. */
	public clearAllEggs(): void {
		for (const [_eggInstanceId, eggComponent] of pairs(this.conveyorEggComponents)) {
			eggComponent.destroy();
		}

		this.logger.Info(`Cleared all eggs from plot ${this.attributes.plotIndex}`);
	}

	/**
	 * 获取当前蛋模型数量.
	 *
	 * @returns 蛋模型数量.
	 */
	public getEggCount(): number {
		return this.getEggModels().size();
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

	/** 初始化 Plot 系统. */
	private initializePlot(): void {
		// 清理可能存在的孤立蛋模型
		this.cleanupOrphanedEggs();

		this.logger.Verbose(`Plot ${this.attributes.plotIndex} initialized successfully`);

		this.initializeConveyorEggs();
		this.initializeExpansions();
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
	}

	private createConveyorEgg(egg: ConveyorEgg): void {
		const eggModel = ReplicatedStorage.Assets.Eggs.FindFirstChild(egg.eggId);
		if (!eggModel) {
			this.logger.Warn(`Egg model ${egg.eggId} not found`);
			return;
		}

		const clone = eggModel.Clone() as EggModel;
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
				this.logger.Verbose(
					`Player ${this.attributes.playerId} unlocked expansion: ${expansionId}`,
				);
			}
		}
	}

	private setExpansionExpanded(expansionId: string, isExpanded: boolean): void {
		const before = isExpanded ? this.instance.Expand : ReplicatedStorage.ExpandReserve;
		const after = isExpanded ? ReplicatedStorage.ExpandReserve : this.instance.Expand;

		const expansionModel = before.FindFirstChild(expansionId);
		if (!expansionModel) {
			return;
		}

		expansionModel.Parent = after;
	}
}
