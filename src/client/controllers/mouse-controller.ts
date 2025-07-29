import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import Signal from "@rbxts/rbx-better-signal";
import { Players, RunService, Workspace } from "@rbxts/services";

import { USER_ID } from "client/constants";
import type { RootStore } from "client/store";
import { selectHeldItem } from "shared/store/players/selectors";
import type { PlayerPlotState } from "shared/store/players/types";
import { ItemType, type PlayerInventoryItem } from "shared/types";

import type { OnPlayerPlotLoaded } from "./plots/plot-controller";

export interface MouseTarget {
	instance: BasePart;
	raycastResult: RaycastResult;
}

export interface MouseDetectionConfig {
	/** 是否忽略水. */
	ignoreWater?: boolean;
	/** 射线检测距离. */
	raycastDistance?: number;
	/** 射线检测白名单. */
	whitelist: Array<Instance>;
}

export type MouseTargetChangedListener = (target?: MouseTarget) => void;
export type MouseClickListener = (target?: MouseTarget) => void;

@Controller({})
export class MouseController implements OnPlayerPlotLoaded {
	private readonly mouse = Players.LocalPlayer.GetMouse();
	private readonly onMouseClick = new Signal<(target?: MouseTarget) => void>();
	private readonly onMouseTargetChanged = new Signal<(target?: MouseTarget) => void>();
	private readonly raycastWhitelist: Array<Instance> = [];

	private config?: MouseDetectionConfig;
	private currentTarget?: MouseTarget;
	private mouseClickConnection?: RBXScriptConnection;
	private mouseConnection?: RBXScriptConnection;

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
	) {}

	public onPlayerPlotLoaded(playerId: string, plot: PlayerPlotState): void {
		if (playerId !== USER_ID) {
			return;
		}

		const playerIndex = plot.index;
		const plotFolder = Workspace.Main.Plots.FindFirstChild(tostring(playerIndex));
		if (!plotFolder) {
			this.logger.Warn(
				`Plot folder not found for player index ${playerIndex}. Cannot set raycast whitelist.`,
			);
			return;
		}

		// 设置白名单
		this.raycastWhitelist.push(plotFolder);

		const dealHeldItem = (heldItem: PlayerInventoryItem | undefined): void => {
			if (heldItem !== undefined) {
				if (heldItem.itemType === ItemType.Hammer) {
					this.startDetection({
						ignoreWater: true,
						raycastDistance: 1000,
						whitelist: this.raycastWhitelist,
					});
				}

				this.logger.Info(`Started mouse detection for held item: ${heldItem.instanceId}`);
			} else {
				this.stopDetection();
			}
		};

		const heldItem = this.store.getState(selectHeldItem(playerId));
		if (heldItem) {
			dealHeldItem(heldItem);
		}

		this.store.subscribe(selectHeldItem(playerId), dealHeldItem);
	}

	/**
	 * 监听鼠标目标变化事件.
	 *
	 * @param listener - 监听器函数.
	 * @returns 取消监听的函数.
	 */
	public onTargetChanged(listener: MouseTargetChangedListener): RBXScriptConnection {
		return this.onMouseTargetChanged.Connect(listener);
	}

	/**
	 * 监听鼠标点击事件.
	 *
	 * @param listener - 监听器函数.
	 * @returns 取消监听的函数.
	 */
	public onClick(listener: MouseClickListener): RBXScriptConnection {
		return this.onMouseClick.Connect(listener);
	}

	/**
	 * 获取当前鼠标指向的目标.
	 *
	 * @returns 当前目标或undefined.
	 */
	public getCurrentTarget(): MouseTarget | undefined {
		return this.currentTarget;
	}

	/**
	 * 开始鼠标检测.
	 *
	 * @param config - 检测配置.
	 */
	private startDetection(config: MouseDetectionConfig): void {
		if (this.mouseConnection) {
			this.logger.Warn("Mouse detection is already running");
			return;
		}

		this.config = config;

		this.mouseConnection = RunService.Heartbeat.Connect(() => {
			this.detectMouseTarget();
		});

		// 监听鼠标点击事件
		this.mouseClickConnection = this.mouse.Button1Down.Connect(() => {
			this.handleMouseClick();
		});

		this.logger.Info("Mouse detection started");
	}

	/** 停止鼠标检测. */
	private stopDetection(): void {
		if (this.mouseConnection) {
			this.mouseConnection.Disconnect();
			this.mouseConnection = undefined;
		}

		if (this.mouseClickConnection) {
			this.mouseClickConnection.Disconnect();
			this.mouseClickConnection = undefined;
		}

		this.currentTarget = undefined;
		this.config = undefined;

		this.logger.Info("Mouse detection stopped");
	}

	/** 检测鼠标指向的目标. */
	private detectMouseTarget(): void {
		if (!this.config) {
			return;
		}

		const camera = Workspace.CurrentCamera;
		if (!camera) {
			return;
		}

		// 创建从相机到鼠标位置的射线
		const unitRay = camera.ScreenPointToRay(this.mouse.X, this.mouse.Y);

		// 设置射线检测参数
		const raycastParameters = new RaycastParams();
		raycastParameters.FilterType = Enum.RaycastFilterType.Include;
		raycastParameters.FilterDescendantsInstances = this.config.whitelist;
		raycastParameters.IgnoreWater = this.config.ignoreWater ?? true;

		// 执行射线检测
		const raycastDistance = this.config.raycastDistance ?? 1000;
		const raycastResult = Workspace.Raycast(
			unitRay.Origin,
			unitRay.Direction.mul(raycastDistance),
			raycastParameters,
		);

		if (!raycastResult) {
			this.updateTarget(undefined);
			return;
		}

		const target = raycastResult.Instance;
		if (!target.IsA("BasePart")) {
			this.updateTarget(undefined);
			return;
		}

		// 创建鼠标目标
		const mouseTarget: MouseTarget = {
			instance: target,
			raycastResult,
		};

		this.updateTarget(mouseTarget);
	}

	/**
	 * 更新当前目标.
	 *
	 * @param newTarget - 新的目标.
	 */
	private updateTarget(newTarget?: MouseTarget): void {
		const previousTarget = this.currentTarget;
		this.currentTarget = newTarget;

		// 如果目标改变了，触发Signal事件
		if (previousTarget !== newTarget) {
			this.onMouseTargetChanged.Fire(newTarget);
		}

		// 显示一个红色小球在当前目标位置
		if (newTarget) {
			const highlightBall =
				(Workspace.FindFirstChild("HighlightBall") as Part | undefined) ??
				new Instance("Part");
			highlightBall.Name = "HighlightBall";
			highlightBall.Size = new Vector3(0.2, 0.2, 0.2);
			highlightBall.Position = newTarget.raycastResult.Position;
			highlightBall.Color = new Color3(1, 0, 0);
			highlightBall.Anchored = true;
			highlightBall.CanCollide = false;
			highlightBall.Parent = Workspace;
		} else {
			// 清除高亮
			const highlightBall = Workspace.FindFirstChild("HighlightBall");
			if (highlightBall) {
				highlightBall.Destroy();
			}
		}
	}

	/** 处理鼠标点击事件. */
	private handleMouseClick(): void {
		this.onMouseClick.Fire(this.currentTarget);
	}
}
