import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Players, RunService, Workspace } from "@rbxts/services";

import { USER_ID } from "client/constants";
import type { RootStore } from "client/store";
import { selectIsHoldingHammer, selectPlayerPlotIndex } from "shared/store/players/selectors";
import type { PlayerPlotState } from "shared/store/players/types";

import type { OnPlayerPlotLoaded } from "./plot-controller";

@Controller({})
export class HammerController implements OnPlayerPlotLoaded {
	private readonly currentHighlight = new Instance("Highlight");
	private readonly mouse = Players.LocalPlayer.GetMouse();
	private readonly raycastWhitelist: Array<Instance> = [];

	private currentHighlightedItem?: Model;
	private hammerSubscription?: () => void;
	private mouseClickConnection?: RBXScriptConnection;
	private mouseConnection?: RBXScriptConnection;

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
	) {
		// 设置高亮样式
		this.currentHighlight.FillColor = Color3.fromRGB(255, 0, 0);
		this.currentHighlight.OutlineColor = Color3.fromRGB(255, 100, 100);
		this.currentHighlight.FillTransparency = 0.3;
		this.currentHighlight.OutlineTransparency = 1;
		this.currentHighlight.DepthMode = Enum.HighlightDepthMode.Occluded;
	}

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

		if (this.mouseClickConnection) {
			this.mouseClickConnection.Disconnect();
			this.mouseClickConnection = undefined;
		}

		if (this.mouseConnection) {
			this.mouseConnection.Disconnect();
			this.mouseConnection = undefined;
		}

		this.clearHighlight();
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
		if (this.mouseConnection) {
			return;
		}

		this.mouseConnection = RunService.Heartbeat.Connect(() => {
			this.detectMouseTarget();
		});

		// 监听鼠标点击事件
		this.mouseClickConnection = this.mouse.Button1Down.Connect(() => {
			this.handleMouseClick();
		});
	}

	/** 停止鼠标检测. */
	private stopMouseDetection(): void {
		if (this.mouseConnection) {
			this.mouseConnection.Disconnect();
			this.mouseConnection = undefined;
		}

		if (this.mouseClickConnection) {
			this.mouseClickConnection.Disconnect();
			this.mouseClickConnection = undefined;
		}

		this.clearHighlight();
	}

	/** 检测鼠标指向的目标. */
	private detectMouseTarget(): void {
		const camera = Workspace.CurrentCamera;
		if (!camera) {
			return;
		}

		// 创建从相机到鼠标位置的射线
		const unitRay = camera.ScreenPointToRay(this.mouse.X, this.mouse.Y);

		// 设置射线检测参数
		const raycastParameters = new RaycastParams();
		raycastParameters.FilterType = Enum.RaycastFilterType.Include;
		raycastParameters.FilterDescendantsInstances = this.raycastWhitelist;
		raycastParameters.IgnoreWater = true;

		// 执行射线检测
		const raycastResult = Workspace.Raycast(
			unitRay.Origin,
			unitRay.Direction.mul(1000),
			raycastParameters,
		);

		if (!raycastResult) {
			this.clearHighlight();
			return;
		}

		const target = raycastResult.Instance;
		if (!target.IsA("BasePart")) {
			this.clearHighlight();
			return;
		}

		// 检查是否是PlayerPlacedItem
		const placedItemResult = this.findPlayerItem(target);
		if (!placedItemResult) {
			this.clearHighlight();
			return;
		}

		this.handleHover(placedItemResult.item, placedItemResult.folderType);
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
	 * @param _folderType - 物品所在的文件夹类型.
	 */
	private handleHover(item: Model, _folderType: "Expand" | "Items"): void {
		// 如果目标改变了，更新高亮
		if (item === this.currentHighlightedItem) {
			return;
		}

		// 移除之前的高亮
		if (this.currentHighlight.Parent) {
			this.currentHighlight.Parent = undefined;
		}

		// 设置新的目标并添加高亮
		this.currentHighlightedItem = item;
		this.currentHighlight.Parent = item;
	}

	/** 处理鼠标点击事件. */
	private handleMouseClick(): void {
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
	 * 处理点击Expand文件夹中的物品.
	 *
	 * @param item - 被点击的物品模型.
	 */
	private handleExpandItemClick(item: Model): void {
		this.logger.Info(`Demolishing expand item ${item.Name}`);
		// 实现拆除逻辑：移除物品、返还资源等
	}

	/**
	 * 处理点击Items文件夹中的物品.
	 *
	 * @param item - 被点击的物品模型.
	 */
	private handleItemsItemClick(item: Model): void {
		this.logger.Info(`Collecting/moving items item ${item.Name})`);
		// 实现收集或移动逻辑：收集物品到背包、移动物品位置等
	}

	/** 清除当前高亮. */
	private clearHighlight(): void {
		if (!this.currentHighlightedItem || !this.currentHighlight.Parent) {
			return;
		}

		this.currentHighlight.Parent = undefined;
		this.currentHighlightedItem = undefined;
	}
}
