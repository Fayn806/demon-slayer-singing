import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import React from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import { Workspace } from "@rbxts/services";

import { USER_ID } from "client/constants";
import type { RootStore } from "client/store";
import { ExpandGui } from "client/ui/screens/expand/expand-gui";
import type { Configs } from "shared/configs";
import { remotes } from "shared/remotes";
import { selectIsHoldingHammer, selectPlayerPlotIndex } from "shared/store/players/selectors";
import type { PlayerPlotState } from "shared/store/players/types";
import { ItemType } from "shared/types";

import type { MouseController, MouseTarget } from "../mouse-controller";
import type { OnPlayerPlotLoaded } from "./plot-controller";

@Controller({})
export class HammerController implements OnPlayerPlotLoaded {
	private readonly expandGuiRoot = createRoot(new Instance("Folder"));
	private readonly raycastWhitelist: Array<Instance> = [];

	private clickUnsubscribe?: RBXScriptConnection;
	private currentHighlight?: Highlight;
	private currentHighlightedItem?: Model;
	private currentSelectedItem?: Model;
	private hammerSubscription?: () => void;
	private targetChangedUnsubscribe?: RBXScriptConnection;

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly mouseController: MouseController,
		private readonly configs: Configs,
	) {}

	public onPlayerPlotLoaded(playerId: string, _plot: PlayerPlotState): void {
		if (playerId !== USER_ID) {
			return;
		}

		this.cleanup();
		this.setupRaycastWhitelist();
		this.listenForHammerUsage(playerId);
	}

	/** 清理资源. */
	public cleanup(): void {
		this.stopMouseDetection();

		if (this.hammerSubscription) {
			this.hammerSubscription();
			this.hammerSubscription = undefined;
		}

		this.clearHighlight();
	}

	/**
	 * 创建新的高亮实例.
	 *
	 * @returns 新的高亮实例.
	 */
	private createHighlight(): Highlight {
		const highlight = new Instance("Highlight");
		highlight.FillColor = Color3.fromRGB(255, 0, 0);
		highlight.OutlineColor = Color3.fromRGB(255, 100, 100);
		highlight.FillTransparency = 0.3;
		highlight.OutlineTransparency = 1;
		highlight.DepthMode = Enum.HighlightDepthMode.Occluded;
		return highlight;
	}

	/** 设置射线检测白名单. */
	private setupRaycastWhitelist(): void {
		const playerIndex = this.store.getState(selectPlayerPlotIndex(USER_ID));
		if (playerIndex === undefined) {
			this.logger.Warn(
				`Player plot index not found for user ${USER_ID}. Cannot set raycast whitelist.`,
			);
			return;
		}

		const plotFolder = Workspace.Main.Plots.FindFirstChild(tostring(playerIndex));
		if (!plotFolder) {
			this.logger.Warn(
				`Plot folder not found for player index ${playerIndex}. Cannot set raycast whitelist.`,
			);
			return;
		}

		// 设置白名单
		this.raycastWhitelist.push(plotFolder);
	}

	/**
	 * 监听玩家是否持有锤子.
	 *
	 * @param playerId - 玩家ID.
	 */
	private listenForHammerUsage(playerId: string): void {
		const isHolding = this.store.getState(selectIsHoldingHammer(playerId));
		if (isHolding) {
			this.logger.Info(`Player ${playerId} is holding a hammer.`);
			this.startMouseDetection();
		}

		this.hammerSubscription = this.store.subscribe(
			selectIsHoldingHammer(playerId),
			isHoldingHammer => {
				if (isHoldingHammer) {
					this.logger.Info(`Player ${playerId} is holding a hammer.`);
					this.startMouseDetection();
				} else {
					this.logger.Info(`Player ${playerId} is not holding a hammer.`);
					this.stopMouseDetection();
				}
			},
		);
	}

	/** 开始鼠标检测. */
	private startMouseDetection(): void {
		// 订阅鼠标事件
		this.targetChangedUnsubscribe = this.mouseController.onTargetChanged(target => {
			this.handleTargetChanged(target);
		});

		this.clickUnsubscribe = this.mouseController.onClick(target => {
			this.handleMouseClick(target);
		});
	}

	/** 停止鼠标检测. */
	private stopMouseDetection(): void {
		// 取消订阅
		if (this.targetChangedUnsubscribe) {
			this.targetChangedUnsubscribe.Disconnect();
			this.targetChangedUnsubscribe = undefined;
		}

		if (this.clickUnsubscribe) {
			this.clickUnsubscribe.Disconnect();
			this.clickUnsubscribe = undefined;
		}

		// 清除高亮
		this.clearHighlight();
	}

	/**
	 * 处理鼠标目标变化.
	 *
	 * @param target - 鼠标指向的目标.
	 */
	private handleTargetChanged(target?: MouseTarget): void {
		if (
			!target ||
			(target.item &&
				(target.item.itemType === ItemType.Egg ||
					target.item.itemType === ItemType.Booster))
		) {
			this.clearHighlight();
			return;
		}

		// 检查是否是PlayerPlacedItem
		const placedItemResult = this.findPlayerItem(target.instance);
		if (!placedItemResult) {
			this.clearHighlight();
			return;
		}

		this.handleHover(placedItemResult.item, placedItemResult.folderType);
	}

	/**
	 * 处理鼠标点击事件.
	 *
	 * @param _target - 被点击的目标.
	 */
	private handleMouseClick(_target?: MouseTarget): void {
		// 如果当前有选中的物品
		if (!this.currentHighlightedItem) {
			return;
		}

		// 根据物品所在的文件夹类型处理不同的点击逻辑
		const parent = this.currentHighlightedItem.Parent;
		if (parent?.IsA("Folder") === true) {
			if (parent.Name === "Expand") {
				this.handleExpandItemClick(this.currentHighlightedItem);
			} else if (parent.Name === "Items") {
				this.handleItemsItemClick(this.currentHighlightedItem);
			}
		}
	}

	/**
	 * 查找PlayerPlacedItem模型.
	 *
	 * @param target - 鼠标指向的目标.
	 * @returns 找到的模型和所在文件夹类型，或undefined.
	 */
	private findPlayerItem(
		target: BasePart,
	): undefined | { folderType: "Expand" | "Items"; item: Model } {
		// 向上遍历寻找PlayerPlacedItem模型和文件夹类型
		let current: Instance | undefined = target;
		let folderType: "Expand" | "Items" | undefined;

		while (current.Parent && !current.Parent.IsA("Folder")) {
			// 检查是否是物品模型
			current = current.Parent;
		}

		const parent = current.Parent;
		if (parent === undefined) {
			return;
		}

		if (!parent.IsA("Folder")) {
			return;
		}

		if (parent.Name === "Expand") {
			folderType = "Expand";
		} else if (parent.Name === "Items") {
			folderType = "Items";
		} else {
			return undefined;
		}

		return { folderType, item: current as Model };
	}

	/**
	 * 处理鼠标指向PlayerPlacedItem.
	 *
	 * @param item - 指向的物品模型.
	 * @param folderType - 物品所在的文件夹类型.
	 */
	private handleHover(item: Model, folderType: "Expand" | "Items"): void {
		// 如果目标改变了，更新高亮
		if (item === this.currentHighlightedItem) {
			return;
		}

		// 移除之前的高亮
		this.clearHighlight();

		// 创建新的高亮并设置目标
		this.currentHighlight = this.createHighlight();
		this.currentHighlightedItem = item;
		this.currentHighlight.Parent = item;

		if (folderType !== "Expand") {
			this.expandGuiRoot.unmount();
			return;
		}

		const price = this.configs.ExpandConfig[item.Name] ?? 0;
		this.expandGuiRoot.render(createPortal(<ExpandGui price={price} selected={false} />, item));
	}

	/**
	 * 处理点击Expand文件夹中的物品.
	 *
	 * @param item - 被点击的物品模型.
	 */
	private handleExpandItemClick(item: Model): void {
		this.logger.Info(`Demolishing expand item ${item.Name}`);
		if (this.currentSelectedItem === item) {
			// 实现拆除逻辑：移除物品、返还资源等
			remotes.plot.expand
				.request(item.Name)
				.andThen(result => {
					if (result === true) {
						this.logger.Info(`Successfully demolished expand item ${item.Name}`);
						// 在这里处理成功拆除后的逻辑
					} else {
						this.logger.Warn(`Failed to demolish expand item ${item.Name}`);
					}
				})
				.catch(err => {
					this.logger.Error(tostring(err));
				});
			return;
		}

		this.currentSelectedItem = item;
		const price = this.configs.ExpandConfig[item.Name] ?? 0;
		this.expandGuiRoot.render(createPortal(<ExpandGui price={price} selected={true} />, item));
	}

	/**
	 * 处理点击Items文件夹中的物品.
	 *
	 * @param item - 被点击的物品模型.
	 */
	private handleItemsItemClick(item: Model): void {
		this.logger.Info(`Collecting/moving items item ${item.Name})`);
		// 实现收集或移动逻辑：收集物品到背包、移动物品位置等
		const instanceId = item.GetAttribute("instanceId") as string | undefined;
		if (instanceId === undefined || instanceId === "") {
			this.logger.Warn(`Item ${item.Name} does not have an instanceId attribute.`);
			return;
		}

		remotes.plot.pickPet
			.request(instanceId)
			.andThen(result => {
				if (result === true) {
					this.logger.Info(`Successfully picked item ${instanceId}`);
					// 在这里处理成功收集后的逻辑
				} else {
					this.logger.Warn(`Failed to pick item ${instanceId}`);
				}
			})
			.catch(err => {
				this.logger.Error(tostring(err));
			});
	}

	/** 清除当前高亮. */
	private clearHighlight(): void {
		// 直接销毁当前高亮实例
		if (this.currentHighlight?.Parent) {
			this.currentHighlight.Destroy();
			this.currentHighlight = undefined;
		}

		this.currentHighlightedItem = undefined;
		this.currentSelectedItem = undefined;

		this.expandGuiRoot.unmount();
	}
}
