import type { Components } from "@flamework/components";
import { BaseComponent, Component } from "@flamework/components";
import type { OnStart } from "@flamework/core";
import { Janitor } from "@rbxts/janitor";
import type { Logger } from "@rbxts/log";
import { CollectionService } from "@rbxts/services";

import type { RootStore } from "client/store";
import { $NODE_ENV } from "rbxts-transform-env";
import { selectPlayerConveyor } from "shared/store/players/selectors";
import { ConveyorSpeedMode, type SpeedHistoryEntry } from "shared/store/players/types";
import { Tag } from "types/enum/tag";
import type { EggModel } from "types/interfaces/components/egg";
import type { PlotAttributes, PlotFolder } from "types/interfaces/components/plot";

import type { ConveyorEggComponent } from "./island/egg/conveyor-egg-component";

@Component({
	refreshAttributes: $NODE_ENV === "development",
	tag: Tag.Plot,
})
export class PlotComponent extends BaseComponent<PlotAttributes, PlotFolder> implements OnStart {
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
		// this.initializePlot();
	}

	/** @ignore */
	public destroy(): void {
		this.logger.Verbose(`Plot ${this.instance.GetFullName()} has been destroyed.`);
		this.janitor.Destroy();
		super.destroy();
	}

	/**
	 * 添加蛋模型到 Eggs 文件夹.
	 *
	 * @param eggModel - 要添加的蛋模型.
	 * @param playerId - 玩家ID.
	 * @param eggInstanceId - 蛋的实例ID.
	 * @returns 添加是否成功.
	 */
	public addEggModel(eggModel: EggModel, playerId: string, eggInstanceId: string): boolean {
		try {
			// 设置蛋模型的名称为实例ID
			eggModel.Name = eggInstanceId;

			// 将蛋模型添加到 Eggs 文件夹
			eggModel.Parent = this.instance.Eggs;
			eggModel.SetAttribute("instanceId", eggInstanceId);
			eggModel.SetAttribute("playerId", playerId);

			const eggComponent = this.components.addComponent<ConveyorEggComponent>(eggModel);
			eggComponent.initialize(this);

			this.logger.Verbose(
				`Added egg model ${eggInstanceId} to plot ${this.attributes.plotIndex}`,
			);
			return true;
		} catch (err) {
			this.logger.Error(
				`Failed to add egg model ${eggInstanceId} to plot ${this.attributes.plotIndex}: ${err}`,
			);
			return false;
		}
	}

	/**
	 * 从 Eggs 文件夹删除蛋模型.
	 *
	 * @param eggInstanceId - 要删除的蛋实例ID.
	 * @returns 删除是否成功.
	 */
	public removeEggModel(eggInstanceId: string): boolean {
		try {
			const eggModel = this.instance.Eggs.FindFirstChild(eggInstanceId);
			if (!eggModel) {
				this.logger.Warn(
					`Egg model ${eggInstanceId} not found in plot ${this.attributes.plotIndex}`,
				);
				return false;
			}

			// 移除 Egg 标签
			CollectionService.RemoveTag(eggModel, Tag.Egg);

			// 销毁蛋模型
			eggModel.Destroy();

			this.logger.Verbose(
				`Removed egg model ${eggInstanceId} from plot ${this.attributes.plotIndex}`,
			);
			return true;
		} catch (err) {
			this.logger.Error(
				`Failed to remove egg model ${eggInstanceId} from plot ${this.attributes.plotIndex}: ${err}`,
			);
			return false;
		}
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
		const eggModels = this.getEggModels();

		for (const eggModel of eggModels) {
			this.removeEggModel(eggModel.Name);
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
}
