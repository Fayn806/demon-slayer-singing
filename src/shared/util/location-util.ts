/** 已放置物品的信息. */
export interface PlacedItemInfo {
	instanceId: string;
	position: Vector3;
	range: number;
}

/** 放置区域信息. */
export interface PlacementArea {
	/** 区域中心位置. */
	center: Vector3;
	/** 区域大小. */
	size: Vector2;
	/** Y轴高度（统一水平面）. */
	yLevel: number;
}

/** 放置验证结果. */
export interface PlacementValidation {
	/** 是否可以放置. */
	canPlace: boolean;
	/** 如果不能放置的原因. */
	reason?: string;
	/** 建议的放置位置. */
	suggestedPosition?: Vector3;
}

/**
 * 计算两个位置在XZ平面上的距离（忽略Y轴）.
 *
 * @param position1 - 第一个位置.
 * @param position2 - 第二个位置.
 * @returns XZ平面上的距离.
 */
export function getXZDistance(position1: Vector3, position2: Vector3): number {
	const dx = position1.X - position2.X;
	const dz = position1.Z - position2.Z;
	return math.sqrt(dx * dx + dz * dz);
}

/**
 * 检查指定位置是否与已放置的物品冲突.
 *
 * @param targetPosition - 目标位置.
 * @param targetRange - 目标物品的范围.
 * @param placedItems - 已放置的物品列表.
 * @returns 是否存在冲突.
 */
export function hasCollisionWithPlacedItems(
	targetPosition: Vector3,
	targetRange: number,
	placedItems: Array<PlacedItemInfo>,
): boolean {
	for (const placedItem of placedItems) {
		const distance = getXZDistance(targetPosition, placedItem.position);
		const minDistance = targetRange + placedItem.range;

		if (distance < minDistance) {
			return true;
		}
	}

	return false;
}

/**
 * 检查位置是否与锁定区域重叠（考虑物品范围）.
 *
 * @param position - 目标位置.
 * @param itemRange - 物品的范围.
 * @param lockedAreas - 锁定的区域列表.
 * @returns 是否与锁定区域重叠.
 */
export function hasOverlapWithLockedAreas(
	position: Vector3,
	itemRange: number,
	lockedAreas: Array<PlacementArea>,
): boolean {
	for (const lockedArea of lockedAreas) {
		// 计算物品的边界
		const itemMinX = position.X - itemRange;
		const itemMaxX = position.X + itemRange;
		const itemMinZ = position.Z - itemRange;
		const itemMaxZ = position.Z + itemRange;

		// 计算锁定区域的边界
		const areaMinX = lockedArea.center.X - lockedArea.size.X / 2;
		const areaMaxX = lockedArea.center.X + lockedArea.size.X / 2;
		const areaMinZ = lockedArea.center.Z - lockedArea.size.Y / 2;
		const areaMaxZ = lockedArea.center.Z + lockedArea.size.Y / 2;

		// 检查是否有重叠
		const overlapX = itemMaxX > areaMinX && itemMinX < areaMaxX;
		const overlapZ = itemMaxZ > areaMinZ && itemMinZ < areaMaxZ;

		if (overlapX && overlapZ) {
			return true;
		}
	}

	return false;
}

/**
 * 检查位置是否在允许的放置区域内（考虑物品范围）.
 *
 * @param position - 目标位置.
 * @param itemRange - 物品的范围.
 * @param area - 放置区域.
 * @returns 是否在区域内.
 */
export function isPositionInArea(
	position: Vector3,
	itemRange: number,
	area: PlacementArea,
): boolean {
	// 考虑物品范围，缩小可放置区域
	const effectiveHalfSizeX = area.size.X / 2 - itemRange;
	const effectiveHalfSizeZ = area.size.Y / 2 - itemRange;

	// 如果物品范围太大，无法在区域内放置
	if (effectiveHalfSizeX <= 0 || effectiveHalfSizeZ <= 0) {
		return false;
	}

	const withinX =
		position.X >= area.center.X - effectiveHalfSizeX &&
		position.X <= area.center.X + effectiveHalfSizeX;
	const withinZ =
		position.Z >= area.center.Z - effectiveHalfSizeZ &&
		position.Z <= area.center.Z + effectiveHalfSizeZ;

	return withinX && withinZ;
}

/**
 * 从 Part 获取 PlacementArea.
 *
 * @param part - 要获取区域信息的 Part.
 * @param yLevel - 可选的Y轴高度，如果未提供则使用 Part 的位置Y坐标.
 * @returns 对应的 PlacementArea.
 */
export function getPlacementAreaFromPart(part: Part, yLevel?: number): PlacementArea {
	const partPosition = part.Position;
	const partSize = part.Size;

	return {
		center: partPosition,
		size: new Vector2(partSize.X, partSize.Z),
		yLevel: yLevel ?? partPosition.Y,
	};
}

/**
 * 将位置限制在指定的边界内（考虑物品范围）.
 *
 * @param position - 原始位置.
 * @param itemRange - 物品的范围.
 * @param area - 放置区域.
 * @returns 限制在边界内的位置.
 */
export function clampPositionToBounds(
	position: Vector3,
	itemRange: number,
	area: PlacementArea,
): Vector3 {
	const { center, size, yLevel } = area;

	// 计算边界的最小和最大坐标（考虑物品范围）
	const effectiveHalfSizeX = size.X / 2 - itemRange;
	const effectiveHalfSizeZ = size.Y / 2 - itemRange;

	const minX = center.X - effectiveHalfSizeX;
	const maxX = center.X + effectiveHalfSizeX;
	const minZ = center.Z - effectiveHalfSizeZ;
	const maxZ = center.Z + effectiveHalfSizeZ;

	// 限制 X 和 Z 坐标在边界内
	const clampedX = math.clamp(position.X, minX, maxX);
	const clampedZ = math.clamp(position.Z, minZ, maxZ);

	// 使用 placementArea 的 yLevel
	return new Vector3(clampedX, yLevel, clampedZ);
}

/**
 * 验证物品是否可以在指定位置放置.
 *
 * @param targetPosition - 目标位置.
 * @param itemInfo - 待放置的物品信息.
 * @param placedItems - 已放置的物品列表.
 * @param placementArea - 允许的放置区域.
 * @returns 放置验证结果.
 */
export function validateItemPlacement(
	targetPosition: Vector3,
	itemInfo: PlacedItemInfo,
	placedItems: Array<PlacedItemInfo>,
	placementArea: PlacementArea,
    lockedPlacementArea?: Array<PlacementArea>,
): PlacementValidation {
	// 获取物品的范围信息
	const itemRange = itemInfo.range;

	// 将目标位置调整到统一的Y轴水平面
	const adjustedPosition = new Vector3(targetPosition.X, placementArea.yLevel, targetPosition.Z);

	// 检查是否在允许的区域内（考虑物品范围）
	const isInArea = isPositionInArea(adjustedPosition, itemRange, placementArea);

	// 如果超出边界，将位置限制到边界内作为建议位置
	const clampedPosition = isInArea
		? adjustedPosition
		: clampPositionToBounds(adjustedPosition, itemRange, placementArea);

	// 检查最终位置是否与已放置的物品冲突
	const hasCollision = hasCollisionWithPlacedItems(clampedPosition, itemRange, placedItems);

	// 检查是否与锁定区域重叠
	const hasLockedOverlap = lockedPlacementArea 
		? hasOverlapWithLockedAreas(clampedPosition, itemRange, lockedPlacementArea)
		: false;

	// 如果在边界内但有冲突或与锁定区域重叠
	if (hasCollision) {
		return {
			canPlace: false,
			reason: "当前位置与已放置物品冲突",
		    suggestedPosition: clampedPosition,
		};
	}

	if (hasLockedOverlap) {
		return {
			canPlace: false,
			reason: "当前位置与锁定区域重叠",
		    suggestedPosition: clampedPosition,
		};
	}

	// 在边界内且无冲突
	return {
		canPlace: true,
		suggestedPosition: clampedPosition,
	};
}

/**
 * 寻找距离目标位置最近的有效放置位置.
 *
 * @param targetPosition - 目标位置.
 * @param itemRange - 物品范围.
 * @param placementArea - 放置区域.
 * @param searchRadius - 搜索半径.
 * @param searchStep - 搜索步长.
 * @returns 找到的有效位置，如果没有则返回undefined.
 */
export function findNearestValidPosition(
	targetPosition: Vector3,
	itemRange: number,
	placementArea: PlacementArea,
	searchRadius = 20,
	searchStep = 1,
): undefined | Vector3 {
	const centerX = targetPosition.X;
	const centerZ = targetPosition.Z;

	// 使用螺旋搜索算法寻找最近的有效位置
	for (let radius = searchStep; radius <= searchRadius; radius += searchStep) {
		const positions = generateCirclePositions(centerX, centerZ, radius, searchStep);

		for (const position of positions) {
			const testPosition = new Vector3(position.X, placementArea.yLevel, position.Y);

			if (isPositionInArea(testPosition, itemRange, placementArea)) {
				return testPosition;
			}
		}
	}

	return undefined;
}

/**
 * 生成圆形分布的位置点.
 *
 * @param centerX - 中心X坐标.
 * @param centerZ - 中心Z坐标.
 * @param radius - 半径.
 * @param step - 步长.
 * @returns 位置点数组.
 */
function generateCirclePositions(
	centerX: number,
	centerZ: number,
	radius: number,
	step: number,
): Array<Vector2> {
	const positions: Array<Vector2> = [];
	const circumference = 2 * math.pi * radius;
	const numberPoints = math.max(8, math.floor(circumference / step));

	for (let index = 0; index < numberPoints; index++) {
		const angle = (2 * math.pi * index) / numberPoints;
		const x = centerX + radius * math.cos(angle);
		const z = centerZ + radius * math.sin(angle);
		positions.push(new Vector2(x, z));
	}

	return positions;
}

/**
 * 获取最优的物品放置位置.
 *
 * @param placedItems - 已放置的物品列表.
 * @param itemInfo - 待放置的物品信息.
 * @param placementArea - 放置区域.
 * @returns 最优放置位置，如果没有则返回undefined.
 */
export function getOptimalPlacementPosition(
	placedItems: Array<PlacedItemInfo>,
	itemInfo: PlacedItemInfo,
	placementArea: PlacementArea,
): undefined | Vector3 {
	const itemRange = itemInfo.range;

	// 如果没有已放置的物品，返回区域中心
	if (placedItems.isEmpty()) {
		const centerPosition = new Vector3(
			placementArea.center.X,
			placementArea.yLevel,
			placementArea.center.Z,
		);

		if (isPositionInArea(centerPosition, itemRange, placementArea)) {
			return centerPosition;
		}
	}

	// 在区域内寻找最优位置
	return findNearestValidPosition(
		placementArea.center,
		itemRange,
		placementArea,
		math.min(placementArea.size.X, placementArea.size.Y) / 2,
	);
}
