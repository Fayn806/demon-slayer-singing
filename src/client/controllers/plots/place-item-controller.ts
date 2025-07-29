import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Players, RunService, Workspace } from "@rbxts/services";

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

@Controller({})
export class PlaceItemController implements OnPlayerPlotLoaded {
	private readonly connections: Array<RBXScriptConnection> = [];
	private readonly lockedExpansionPositions: Array<PlacementArea> = [];
	private readonly mouse: Mouse;

	private playerPlacedItemFolder: Folder | undefined;
	private previewPart: Part | undefined;
	private targetPosition: undefined | Vector3;

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly mouseController: MouseController,
	) {
		this.mouse = Players.LocalPlayer.GetMouse();
	}

	/** @ignore */
	public onPlayerPlotLoaded(playerId: string, plot: PlayerPlotState): void {
		this.logger.Info(
			`EggController initialized for player ${playerId} on plot ${plot.islandId} at index ${plot.index}.`,
		);

		if (playerId !== USER_ID) {
			return;
		}

		const heldItem = this.store.getState(selectHeldItem(playerId));
		if (heldItem && heldItem.itemType !== ItemType.Hammer) {
			this.heldItemHandler(heldItem);
		}

		this.store.subscribe(selectHeldItem(playerId), newHeldItem => {
			if (newHeldItem) {
				if (newHeldItem.itemType !== ItemType.Hammer) {
					this.heldItemHandler(newHeldItem);
				} else {
					this.logger.Warn(`Unhandled held item type: ${newHeldItem.itemType}`);
				}
			} else {
				this.cleanupHeldItem();
			}
		});

		const unloadedExpansions = this.store.getState(selectUnlockedExpansions(playerId));
		if (unloadedExpansions) {
			this.updateExpansionsPositions(unloadedExpansions);
		}
		this.store.subscribe(selectUnlockedExpansions(playerId), expansions => {
			this.updateExpansionsPositions(expansions);
		});
	}

	private updateExpansionsPositions(expansions: Array<string>): void {
		const playerIndex = this.store.getState(selectPlayerPlotIndex(USER_ID));
		const plotFolder = Workspace.Main.Plots.FindFirstChild(tostring(playerIndex));
		if (!plotFolder) {
			this.logger.Warn(`Plot folder not found for player index ${playerIndex}.`);
			return undefined;
		}

		const ExpandFolder = plotFolder.FindFirstChild("Expand");
		if (!ExpandFolder || !ExpandFolder.IsA("Folder")) {
			this.logger.Warn(`Expand folder not found in plot folder for player index ${playerIndex}.`);
			return;
		}

		this.lockedExpansionPositions.clear();
		for (const model of ExpandFolder.GetChildren()) {
			if (model.IsA("Model")) {
				const modelName = model.Name;
				if (expansions.includes(modelName)) {
					// 如果模型是已解锁的扩展，则添加跳过
					continue;
				}
				const blocker = model.FindFirstChild("Blocker");
				if (!blocker || !blocker.IsA("Part")) {
					this.logger.Warn(`Blocker part not found in expansion model: ${model.Name}`);
					continue;
				}

				const area = getPlacementAreaFromPart(blocker);
				if (!area) {
					this.logger.Warn(`Failed to get placement area from blocker part: ${model.Name}`);
					continue;
				}

				this.lockedExpansionPositions.push(area);
			}
		}
	}

	private getPlayerPlacedItemFolder(): Folder | undefined {
		if (this.playerPlacedItemFolder !== undefined) {
			return this.playerPlacedItemFolder;
		}

		const playerIndex = this.store.getState(selectPlayerPlotIndex(USER_ID));
		const plotFolder = Workspace.Main.Plots.FindFirstChild(tostring(playerIndex));
		if (!plotFolder) {
			this.logger.Warn(`Plot folder not found for player index ${playerIndex}.`);
			return undefined;
		}

		const placedItemFolder = plotFolder.FindFirstChild("Items");
		if (!placedItemFolder) {
			this.logger.Warn(
				`Items folder not found in plot folder for player index ${playerIndex}.`,
			);
			return undefined;
		}

		this.playerPlacedItemFolder = placedItemFolder as Folder;
		return this.playerPlacedItemFolder;
	}

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

				// 获取物品位置
				const position = child.IsA("Model") ? child.GetPivot().Position : child.Position;

				// 获取物品范围（可以从属性中读取或根据类型设置默认值）
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

		// 定义放置区域（这里需要根据实际的地块大小调整）
		const plotCenter = this.getPlotCenter();
		const placementArea: PlacementArea = {
			center: plotCenter,
			// 假设地块大小为50x50
			size: new Vector2(91.002, 78),
			// 使用地块中心的Y坐标作为统一水平面
			yLevel: plotCenter.Y + 1,
		};

		// 创建预览物品
		this.createPreviewPart(itemInfo.range);

		// 使用 RunService 来更新预览物品位置
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

				// 设置目标位置
				const newTargetPosition = validation.suggestedPosition ?? mousePosition;
				this.targetPosition = newTargetPosition;

				// 更新预览物品的颜色
				this.updatePreviewPartColor(validation.canPlace);

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
		const clickConnection = this.mouse.Button1Down.Connect(() => {
			// 计算鼠标射线与地块平面的交点
			const mousePosition = this.getMousePlaneIntersection(placementArea.yLevel);

			if (!mousePosition) {
				this.logger.Warn("Cannot place item - mouse not pointing at valid position");
				return;
			}

			const validation = validateItemPlacement(
				mousePosition,
				itemInfo,
				placedItems,
				placementArea,
				this.lockedExpansionPositions,
			);

			if (validation.canPlace && validation.suggestedPosition) {
				this.logger.Info(`Placing item at position: ${validation.suggestedPosition}`);
				// 这里调用实际的物品放置逻辑
				this.placeItemAtPosition(heldItem, validation.suggestedPosition);
			} else if (validation.suggestedPosition) {
				this.logger.Info(
					`Placing item at suggested position: ${validation.suggestedPosition}`,
				);
				// 使用建议位置放置物品
				this.placeItemAtPosition(heldItem, validation.suggestedPosition);
			} else {
				this.logger.Warn("Cannot place item - no valid position found");
			}
		});

		// 存储连接以便后续清理
		this.connections.push(renderStepConnection, clickConnection);
	}

	private getPlotCenter(): Vector3 {
		// 默认位置
		return new Vector3(-474.499, 13.459, -1007);
	}

	private placeItemAtPosition(item: PlayerInventoryItem, position: Vector3): void {
		this.logger.Info(`Placing item ${item.instanceId} at position ${position}`);
		// 这里实现实际的物品放置逻辑
		// 例如：创建物品模型、设置位置、更新状态等
		// 暂时留空，等待具体实现
	}

	private cleanupHeldItem(): void {
		this.logger.Info("Cleaning up held item.");
		// 清理手持物品逻辑
		this.destroyPreviewPart();
		// 重置目标位置
		this.targetPosition = undefined;
		// 清理所有连接
		for (const connection of this.connections) {
			connection.Disconnect();
		}

		// 清空连接数组（虽然是 readonly，但可以修改内容）
		this.connections.clear();
	}

	private createPreviewPart(itemRange: number): Part {
		// 如果已经存在预览物品，先销毁它
		this.destroyPreviewPart();

		// 创建圆形预览物品
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

		// 设置透明度
		previewPart.Transparency = 0.7;

		// 默认颜色为绿色（可放置）
		previewPart.Color = Color3.fromRGB(0, 255, 0);

		// 放置到工作区
		previewPart.Parent = Workspace;

		this.previewPart = previewPart;
		return previewPart;
	}

	private updatePreviewPart(position: Vector3, canPlace: boolean): void {
		if (!this.previewPart) {
			return;
		}

		// 更新位置
		this.previewPart.Position = position;

		// 更新颜色：绿色表示可放置，红色表示不可放置
		this.previewPart.Color = canPlace ? Color3.fromRGB(0, 255, 0) : Color3.fromRGB(255, 0, 0);
	}

	/** 使用 lerp 平滑更新预览物体位置. */
	private updatePreviewPartPosition(): void {
		if (!this.previewPart) {
			return;
		}

		if (this.targetPosition) {
			// 缓动速度控制参数
			const alpha = 0.3;
			const currentPosition = this.previewPart.Position;
			const newPosition = currentPosition.Lerp(this.targetPosition, alpha);
			this.previewPart.Position = newPosition;
			this.previewPart.Rotation = new Vector3(0, 0, 90);

			// 确保预览物体可见
			this.previewPart.Transparency = 0.5;
		} else {
			// 没有目标位置时隐藏预览物体
			this.previewPart.Transparency = 1;
		}
	}

	/**
	 * 更新预览物体颜色.
	 *
	 * @param canPlace - 是否可以放置物品.
	 */
	private updatePreviewPartColor(canPlace: boolean): void {
		if (!this.previewPart) {
			return;
		}

		// 更新颜色：绿色表示可放置，红色表示不可放置
		this.previewPart.Color = canPlace ? Color3.fromRGB(0, 255, 0) : Color3.fromRGB(255, 0, 0);
	}

	private destroyPreviewPart(): void {
		if (!this.previewPart) {
			return;
		}

		this.previewPart.Destroy();
		this.previewPart = undefined;
	}

	/**
	 * 计算鼠标射线与指定Y平面的交点.
	 *
	 * @param yLevel - Y平面的高度.
	 * @returns 交点位置，如果没有交点则返回undefined.
	 */
	private getMousePlaneIntersection(yLevel: number): undefined | Vector3 {
		// 直接使用鼠标的射线属性
		const rayOrigin = this.mouse.Origin.Position;
		const rayDirection = this.mouse.UnitRay.Direction;

		// 计算射线与Y平面的交点
		// 平面方程: Y = yLevel
		// 射线方程: P = Origin + t * Direction
		// 求解: Origin.Y + t * Direction.Y = yLevel
		// parameter = (yLevel - Origin.Y) / Direction.Y

		if (math.abs(rayDirection.Y) < 0.0001) {
			// 射线几乎平行于Y平面，无交点
			return undefined;
		}

		const parameter = (yLevel - rayOrigin.Y) / rayDirection.Y;

		// 如果parameter < 0，交点在射线起点后方
		if (parameter < 0) {
			return undefined;
		}

		// 计算交点
		return rayOrigin.add(rayDirection.mul(parameter));
	}

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
				return 1;
			}
		}
	}
}
