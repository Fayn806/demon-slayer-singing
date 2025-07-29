import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Players, RunService, UserInputService, Workspace } from "@rbxts/services";

import { USER_ID } from "client/constants";
import type { RootStore } from "client/store";
import {
	selectHeldItem,
	selectPlayerPlotIndex,
	selectUnlockedExpansions,
} from "shared/store/players/selectors";
import type { PlayerPlotState } from "shared/store/players/types";
import { ItemType, type PlayerInventoryItem } from "shared/types";
import {
	getPlacementAreaFromPart,
	type PlacedItemInfo,
	type PlacementArea,
	validateItemPlacement,
} from "shared/util/location-util";

import type { MouseController } from "../mouse-controller";
import type { OnPlayerPlotLoaded } from "./plot-controller";

/**
 * 物品放置控制器.
 *
 * 负责处理玩家手持物品的放置逻辑，包括：.
 *
 * - 预览物品位置和可放置状态
 * - 验证放置位置的有效性
 * - 处理鼠标交互和物品放置
 * - 管理锁定区域和扩展区域.
 */
@Controller({})
export class PlaceItemController implements OnPlayerPlotLoaded {
	/** RunService 和鼠标事件连接数组. */
	private readonly connections: Array<RBXScriptConnection> = [];
	/** 锁定的扩展区域位置数组（未解锁的扩展区域不能放置物品）. */
	private readonly lockedExpansionPositions: Array<PlacementArea> = [];
	/** 本地玩家的鼠标对象. */
	private readonly mouse: Mouse;

	/** 玩家已放置物品的文件夹缓存. */
	private playerPlacedItemFolder: Folder | undefined;
	/** 预览物品的 Part 对象. */
	private previewPart: Part | undefined;
	/** 当前目标位置（用于平滑移动预览物品）. */
	private targetPosition: undefined | Vector3;

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly mouseController: MouseController,
	) {
		// 获取本地玩家的鼠标对象
		this.mouse = Players.LocalPlayer.GetMouse();
	}

	/**
	 * 当玩家地块加载完成时的回调函数.
	 *
	 * @param playerId - 玩家ID.
	 * @param plot - 玩家地块状态.
	 */
	public onPlayerPlotLoaded(playerId: string, plot: PlayerPlotState): void {
		this.logger.Info(
			`PlaceItemController initialized for player ${playerId} on plot ${plot.islandId} at index ${plot.index}.`,
		);

		// 只处理本地玩家的事件
		if (playerId !== USER_ID) {
			return;
		}

		// 检查当前是否有手持物品
		const heldItem = this.store.getState(selectHeldItem(playerId));
		// 如果有手持物品且不是锤子类型，开始处理放置逻辑
		if (heldItem && heldItem.itemType !== ItemType.Hammer) {
			this.heldItemHandler(heldItem);
		}

		// 监听手持物品状态变化
		this.store.subscribe(selectHeldItem(playerId), newHeldItem => {
			if (newHeldItem && newHeldItem.itemType !== ItemType.Hammer) {
				this.heldItemHandler(newHeldItem);
				return;
			}

			// 没有手持物品时清理相关逻辑
			this.cleanupHeldItem();
		});

		// 获取并监听未解锁的扩展区域
		const unloadedExpansions = this.store.getState(selectUnlockedExpansions(playerId));
		this.updateExpansionsPositions(unloadedExpansions);

		this.store.subscribe(selectUnlockedExpansions(playerId), expansions => {
			this.updateExpansionsPositions(expansions);
		});
	}

	/**
	 * 更新扩展区域的锁定位置 将未解锁的扩展区域标记为锁定，不允许在这些区域放置物品.
	 *
	 * @param expansions - 已解锁的扩展区域名称数组.
	 * @returns Void.
	 */
	private updateExpansionsPositions(expansions: Array<string>): void {
		// 获取玩家地块文件夹
		const playerIndex = this.store.getState(selectPlayerPlotIndex(USER_ID));
		const plotFolder = Workspace.Main.Plots.FindFirstChild(tostring(playerIndex));
		if (!plotFolder) {
			this.logger.Warn(`Plot folder not found for player index ${playerIndex}.`);
			return undefined;
		}

		// 查找扩展区域文件夹
		const ExpandFolder = plotFolder.FindFirstChild("Expand");
		if (ExpandFolder?.IsA("Folder") !== true) {
			this.logger.Warn(
				`Expand folder not found in plot folder for player index ${playerIndex}.`,
			);
			return;
		}

		// 清空之前的锁定区域
		this.lockedExpansionPositions.clear();

		// 遍历所有扩展模型
		for (const model of ExpandFolder.GetChildren()) {
			if (model.IsA("Model")) {
				const modelName = model.Name;

				// 如果模型是已解锁的扩展，跳过处理
				if (expansions.includes(modelName)) {
					continue;
				}

				// 查找阻挡器部件
				const blocker = model.FindFirstChild("Blocker");
				if (blocker?.IsA("Part") !== true) {
					this.logger.Warn(`Blocker part not found in expansion model: ${model.Name}`);
					continue;
				}

				// 从阻挡器部件获取放置区域信息
				const area = getPlacementAreaFromPart(blocker);

				// 添加到锁定区域列表
				this.lockedExpansionPositions.push(area);
			}
		}
	}

	/**
	 * 获取玩家已放置物品的文件夹 使用缓存机制避免重复查找.
	 *
	 * @returns 已放置物品的文件夹，如果未找到则返回 undefined.
	 */
	private getPlayerPlacedItemFolder(): Folder | undefined {
		// 如果已经缓存，直接返回
		if (this.playerPlacedItemFolder !== undefined) {
			return this.playerPlacedItemFolder;
		}

		// 查找玩家地块文件夹
		const playerIndex = this.store.getState(selectPlayerPlotIndex(USER_ID));
		const plotFolder = Workspace.Main.Plots.FindFirstChild(tostring(playerIndex));
		if (!plotFolder) {
			this.logger.Warn(`Plot folder not found for player index ${playerIndex}.`);
			return undefined;
		}

		// 查找已放置物品文件夹
		const placedItemFolder = plotFolder.FindFirstChild("Items");
		if (!placedItemFolder) {
			this.logger.Warn(
				`Items folder not found in plot folder for player index ${playerIndex}.`,
			);
			return undefined;
		}

		// 缓存文件夹引用
		this.playerPlacedItemFolder = placedItemFolder as Folder;
		return this.playerPlacedItemFolder;
	}

	/**
	 * 获取当前地块中所有已放置物品的数据 遍历 Items 文件夹中的所有子对象，提取位置和范围信息.
	 *
	 * @returns 已放置物品信息数组.
	 */
	private getPlacedItemsData(): Array<PlacedItemInfo> {
		const placedItemFolder = this.getPlayerPlacedItemFolder();
		if (!placedItemFolder) {
			return [];
		}

		const placedItems: Array<PlacedItemInfo> = [];

		// 遍历文件夹中的所有已放置物品
		for (const child of placedItemFolder.GetChildren()) {
			if (child.IsA("Model") || child.IsA("Part")) {
				// 从物品的属性或名称中获取 instanceId
				const attributeInstanceId = child.GetAttribute("InstanceId");
				const instanceId = typeIs(attributeInstanceId, "string")
					? attributeInstanceId
					: child.Name;

				// 获取物品位置（Model 使用 GetPivot，Part 使用 Position）
				const position = child.IsA("Model") ? child.GetPivot().Position : child.Position;

				// 获取物品范围（从属性中读取或使用默认值）
				const attributeRange = child.GetAttribute("Range");
				const range = typeIs(attributeRange, "number") ? attributeRange : 2;

				placedItems.push({
					instanceId,
					position,
					range,
				});
			}
		}

		return placedItems;
	}

	/**
	 * 处理手持物品的放置逻辑 设置预览系统、位置验证和鼠标交互.
	 *
	 * @param heldItem - 当前手持的物品.
	 */
	private heldItemHandler(heldItem: PlayerInventoryItem | undefined): void {
		if (!heldItem) {
			this.logger.Warn("No held item found.");
			return;
		}

		this.logger.Info(`Handling held item: ${heldItem.instanceId} of type ${heldItem.itemType}`);

		// 获取当前已放置的物品信息
		const placedItems = this.getPlacedItemsData();

		// 创建待放置物品的信息（包含范围）
		const itemInfo: PlacedItemInfo = {
			instanceId: heldItem.instanceId,
			// 位置会在验证时重新设置
			position: new Vector3(0, 0, 0),
			range: this.getItemRangeByType(heldItem.itemType),
		};

		// 定义放置区域（根据实际地块大小调整）
		const plotCenter = this.getPlotCenter();
		const placementArea: PlacementArea = {
			center: plotCenter,
			// 地块大小
			size: new Vector2(91.002, 78),
			// 使用地块中心的Y坐标作为统一水平面
			yLevel: plotCenter.Y + 1,
		};

		// 创建预览物品
		this.createPreviewPart(itemInfo.range);

		// 使用 RunService 来实时更新预览物品位置和状态
		const renderStepConnection = RunService.Heartbeat.Connect(() => {
			// 计算鼠标射线与地块平面的交点
			const mousePosition = this.getMousePlaneIntersection(placementArea.yLevel);

			if (mousePosition) {
				// 验证是否可以在该位置放置物品
				const validation = validateItemPlacement(
					mousePosition,
					itemInfo,
					placedItems,
					placementArea,
					this.lockedExpansionPositions,
				);

				// 设置目标位置（使用建议位置或原始鼠标位置）
				const newTargetPosition = validation.suggestedPosition ?? mousePosition;
				this.targetPosition = newTargetPosition;

				// 更新预览物品的颜色
				this.updatePreviewPartColor(validation.canPlace);

				// 记录验证结果
				if (validation.canPlace) {
					this.logger.Verbose("Item can be placed at mouse position");
				} else {
					this.logger.Verbose(`Cannot place item: ${validation.reason}`);
				}
			} else {
				// 鼠标没有指向有效位置，隐藏预览物品
				this.targetPosition = undefined;
			}

			// 使用 lerp 平滑移动预览物品到目标位置
			this.updatePreviewPartPosition();
		});

		// 监听鼠标点击事件来实际放置物品
		const clickConnection = UserInputService.InputEnded.Connect((input, gameProcessed) => {
			// 检查是否为鼠标左键点击，或者touch
			if (
				input.UserInputType !== Enum.UserInputType.MouseButton1 &&
				input.UserInputType !== Enum.UserInputType.Touch
			) {
				return;
			}

			// 如果输入被游戏处理（如UI交互），则不执行放置逻辑
			if (gameProcessed) {
				return;
			}

			// 计算鼠标射线与地块平面的交点
			const mousePosition = this.getMousePlaneIntersection(placementArea.yLevel);

			if (!mousePosition) {
				this.logger.Warn("Cannot place item - mouse not pointing at valid position");
				return;
			}

			// 验证放置位置
			const validation = validateItemPlacement(
				mousePosition,
				itemInfo,
				placedItems,
				placementArea,
				this.lockedExpansionPositions,
			);

			// 根据验证结果执行放置逻辑
			if (validation.canPlace && validation.suggestedPosition) {
				this.logger.Info(`Placing item at position: ${validation.suggestedPosition}`);
				this.placeItemAtPosition(heldItem, validation.suggestedPosition);
			} else if (validation.suggestedPosition) {
				this.logger.Info(
					`Placing item at suggested position: ${validation.suggestedPosition}`,
				);
				// 即使不能完美放置，也使用建议位置
				this.placeItemAtPosition(heldItem, validation.suggestedPosition);
			} else {
				this.logger.Warn("Cannot place item - no valid position found");
			}
		});

		// 存储连接以便后续清理
		this.connections.push(renderStepConnection, clickConnection);
	}

	/**
	 * 获取地块中心位置.
	 *
	 * @returns 地块中心的世界坐标.
	 */
	private getPlotCenter(): Vector3 {
		// 默认位置（临时硬编码）
		// 将来应该从实际的地块数据中获取
		return new Vector3(-474.499, 13.459, -1007);
	}

	/**
	 * 在指定位置放置物品.
	 *
	 * @param item - 要放置的物品.
	 * @param position - 放置位置.
	 */
	private placeItemAtPosition(item: PlayerInventoryItem, position: Vector3): void {
		this.logger.Info(`Placing item ${item.instanceId} at position ${position}`);
		// 将来实现实际的物品放置逻辑
		// 例如：创建物品模型、设置位置、更新状态等
	}

	/** 清理手持物品相关的所有资源 包括预览物品、事件连接和状态重置. */
	private cleanupHeldItem(): void {
		this.logger.Info("Cleaning up held item.");

		// 销毁预览物品
		this.destroyPreviewPart();

		// 重置目标位置
		this.targetPosition = undefined;

		// 断开所有事件连接
		for (const connection of this.connections) {
			connection.Disconnect();
		}

		// 清空连接数组
		this.connections.clear();
	}

	/**
	 * 创建圆形预览物品 用于显示物品的放置范围和可放置状态.
	 *
	 * @param itemRange - 物品的影响范围.
	 * @returns 创建的预览 Part 对象.
	 */
	private createPreviewPart(itemRange: number): Part {
		// 如果已经存在预览物品，先销毁它
		this.destroyPreviewPart();

		// 创建圆形预览物品（使用圆柱体）
		const previewPart = new Instance("Part");
		previewPart.Name = "ItemPreview";
		previewPart.Shape = Enum.PartType.Cylinder;
		previewPart.Material = Enum.Material.Neon;
		previewPart.CanCollide = false;
		previewPart.Anchored = true;
		previewPart.TopSurface = Enum.SurfaceType.Smooth;
		previewPart.BottomSurface = Enum.SurfaceType.Smooth;

		// 设置大小（直径 = 范围 * 2，高度较小用于显示）
		const diameter = itemRange * 2;
		previewPart.Size = new Vector3(0.05, diameter, diameter);

		// 设置视觉属性
		previewPart.Transparency = 0.7;
		// 默认绿色（可放置）
		previewPart.Color = Color3.fromRGB(0, 255, 0);

		// 放置到工作区
		previewPart.Parent = Workspace;

		this.previewPart = previewPart;
		return previewPart;
	}

	/**
	 * 更新预览物品的位置和颜色.
	 *
	 * @deprecated 使用 updatePreviewPartPosition 和 updatePreviewPartColor 替代.
	 * @param position - 新位置.
	 * @param canPlace - 是否可以放置.
	 */
	private updatePreviewPart(position: Vector3, canPlace: boolean): void {
		if (!this.previewPart) {
			return;
		}

		// 更新位置
		this.previewPart.Position = position;

		// 更新颜色：绿色表示可放置，红色表示不可放置
		this.previewPart.Color = canPlace ? Color3.fromRGB(0, 255, 0) : Color3.fromRGB(255, 0, 0);
	}

	/** 使用线性插值平滑更新预览物体位置 提供流畅的视觉反馈体验. */
	private updatePreviewPartPosition(): void {
		if (!this.previewPart) {
			return;
		}

		if (this.targetPosition) {
			// 缓动速度控制参数（0-1之间，值越大移动越快）
			const alpha = 0.3;
			const currentPosition = this.previewPart.Position;
			const newPosition = currentPosition.Lerp(this.targetPosition, alpha);

			// 更新位置和旋转
			this.previewPart.Position = newPosition;
			// 水平放置圆柱体
			this.previewPart.Rotation = new Vector3(0, 0, 90);

			// 确保预览物体可见
			this.previewPart.Transparency = 0.5;
		} else {
			// 没有目标位置时隐藏预览物体
			this.previewPart.Transparency = 1;
		}
	}

	/**
	 * 更新预览物体颜色 根据是否可以放置来显示不同的颜色反馈.
	 *
	 * @param canPlace - 是否可以放置物品.
	 */
	private updatePreviewPartColor(canPlace: boolean): void {
		if (!this.previewPart) {
			return;
		}

		// 绿色表示可放置，红色表示不可放置
		this.previewPart.Color = canPlace ? Color3.fromRGB(0, 255, 0) : Color3.fromRGB(255, 0, 0);
	}

	/** 销毁预览物体并清理引用. */
	private destroyPreviewPart(): void {
		if (!this.previewPart) {
			return;
		}

		this.previewPart.Destroy();
		this.previewPart = undefined;
	}

	/**
	 * 计算鼠标射线与指定Y平面的交点 使用射线-平面相交算法.
	 *
	 * @param yLevel - Y平面的高度.
	 * @returns 交点位置，如果没有交点则返回 undefined.
	 */
	private getMousePlaneIntersection(yLevel: number): undefined | Vector3 {
		// 获取鼠标射线信息
		const rayOrigin = this.mouse.Origin.Position;
		const rayDirection = this.mouse.UnitRay.Direction;

		// 计算射线与Y平面的交点
		// 平面方程: Y = yLevel
		// 射线方程: P = Origin + t * Direction
		// 求解: Origin.Y + t * Direction.Y = yLevel
		// 因此: t = (yLevel - Origin.Y) / Direction.Y

		if (math.abs(rayDirection.Y) < 0.0001) {
			// 射线几乎平行于Y平面，无交点
			return undefined;
		}

		const parameter = (yLevel - rayOrigin.Y) / rayDirection.Y;

		// 如果 parameter < 0，交点在射线起点后方（无效）
		if (parameter < 0) {
			return undefined;
		}

		// 计算交点坐标
		return rayOrigin.add(rayDirection.mul(parameter));
	}

	/**
	 * 根据物品类型获取对应的影响范围 不同类型的物品有不同的占用空间和影响范围.
	 *
	 * @param itemType - 物品类型.
	 * @returns 物品的影响范围半径.
	 */
	private getItemRangeByType(itemType: ItemType): number {
		switch (itemType) {
			case ItemType.Booster: {
				return 1;
			}
			case ItemType.Decoration: {
				return 1;
			}
			case ItemType.Egg: {
				return 1;
			}
			case ItemType.Hammer: {
				return 2;
			}
			case ItemType.HatchedPet: {
				return 1.5;
			}
			case ItemType.Pet: {
				return 1.5;
			}
			default: {
				// 未知类型使用默认范围
				return 1;
			}
		}
	}
}
