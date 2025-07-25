import { Workspace } from "@rbxts/services";

import { CONVEYOR_CONSTANTS, EGG_MOVE_DURATION_CONSTANTS } from "shared/constants/game";
import type { SpeedHistoryEntry } from "shared/store/players/types";
import { ConveyorSpeedMode } from "shared/store/players/types";
import type { ConveyorConfig, ConveyorEgg } from "shared/types";

/**
 * 根据速度模式获取蛋的移动时间.
 *
 * @param speed - 传送带速度模式.
 * @returns 蛋完整移动所需的时间（秒）.
 */
export function getEggMoveTime(speed: ConveyorSpeedMode): number {
	switch (speed) {
		case ConveyorSpeedMode.Fast: {
			return EGG_MOVE_DURATION_CONSTANTS.FAST;
		}
		case ConveyorSpeedMode.Normal: {
			return EGG_MOVE_DURATION_CONSTANTS.NORMAL;
		}
		case ConveyorSpeedMode.Slow: {
			return EGG_MOVE_DURATION_CONSTANTS.SLOW;
		}
		default: {
			// 默认使用 Normal 速度
			return EGG_MOVE_DURATION_CONSTANTS.NORMAL;
		}
	}
}

/**
 * 计算传送带配置（基于速度）.
 *
 * @param speed - 传送带速度倍数.
 * @returns 传送带配置.
 */
export function getConveyorConfig(speed: ConveyorSpeedMode): ConveyorConfig {
	/** 防止除零. */
	const effectiveSpeed = math.max(speed, 0.1);

	return {
		length: CONVEYOR_CONSTANTS.BASE_LENGTH,
		moveTime: CONVEYOR_CONSTANTS.BASE_MOVE_TIME / effectiveSpeed,
		speedMultiplier: effectiveSpeed,
	};
}

/**
 * 计算蛋在传送带上的移动进度（0-1）. 基于速度历史记录和总移动时间计算蛋的准确移动进度，考虑了蛋在移动过程中传送带速度的所有变化.
 *
 * @param eggMoveStartTime - 蛋开始移动的时间.
 * @param currentTime - 当前时间（可选，默认使用服务器时间）.
 * @param speedHistory - 速度变化历史记录（按时间排序）. 每个条目表示在该时间点切换成该速度.
 * @returns 进度百分比（0-1）.
 */
export function calculateEggProgress(
	eggMoveStartTime: number,
	currentTime: number | undefined,
	speedHistory: Array<SpeedHistoryEntry>,
): number {
	const time = currentTime ?? Workspace.GetServerTimeNow();

	// 如果蛋还没开始移动
	if (time <= eggMoveStartTime) {
		return 0;
	}

	let totalDistanceRatio = 0;
	let segmentStartTime = eggMoveStartTime;

	// 找到蛋开始时的速度（找到蛋开始时间之前最后一次速度切换）
	/** 默认速度. */
	let segmentSpeed = ConveyorSpeedMode.Normal;
	for (const entry of speedHistory) {
		if (entry.time <= eggMoveStartTime) {
			segmentSpeed = entry.speedMode;
		} else {
			break;
		}
	}

	// 处理所有在蛋移动期间发生的速度变化
	for (const entry of speedHistory) {
		if (entry.time <= eggMoveStartTime) {
			/** 跳过蛋开始移动之前的记录. */
			continue;
		}

		if (entry.time >= time) {
			/** 跳过当前时间之后的记录. */
			break;
		}

		// 计算当前时间段的进度
		const segmentDuration = entry.time - segmentStartTime;
		const segmentMoveTime = getEggMoveTime(segmentSpeed);
		const segmentDistanceRatio = segmentDuration / segmentMoveTime;
		totalDistanceRatio += segmentDistanceRatio;

		// 如果已经完成移动，直接返回
		if (totalDistanceRatio >= 1) {
			return 1;
		}

		// 更新到下一个时间段
		segmentStartTime = entry.time;
		/** 在entry.time时切换成entry.speedMode. */
		segmentSpeed = entry.speedMode;
	}

	// 计算最后一段（从最后一次速度变化到当前时间）
	const finalSegmentDuration = time - segmentStartTime;
	const finalMoveTime = getEggMoveTime(segmentSpeed);
	const finalDistanceRatio = finalSegmentDuration / finalMoveTime;
	totalDistanceRatio += finalDistanceRatio;

	return math.max(0, math.min(1, totalDistanceRatio));
}

/**
 * 检查蛋是否已经错过（掉落）.
 *
 * @param eggMoveStartTime - 蛋开始移动的时间.
 * @param currentTime - 当前时间（可选，默认使用服务器时间）.
 * @param speedHistory - 速度变化历史记录.
 * @returns 是否已错过.
 */
export function isEggMissed(
	eggMoveStartTime: number,
	currentTime: number | undefined,
	speedHistory: Array<SpeedHistoryEntry>,
): boolean {
	const progress = calculateEggProgress(eggMoveStartTime, currentTime, speedHistory);
	return progress >= CONVEYOR_CONSTANTS.EGG_DROP_POSITION;
}

/**
 * 计算蛋在传送带上的实际位置（世界坐标）. 基于速度历史记录计算精确位置.
 *
 * @param egg - 传送带蛋.
 * @param speedHistory - 速度变化历史记录.
 * @param conveyorStartPosition - 传送带起始位置.
 * @param conveyorEndPosition - 传送带结束位置.
 * @param currentTime - 当前时间（可选，默认使用服务器时间）.
 * @returns 蛋的当前世界位置.
 */
export function calculateEggWorldPosition(
	egg: ConveyorEgg,
	speedHistory: Array<SpeedHistoryEntry>,
	conveyorStartPosition: CFrame,
	conveyorEndPosition: CFrame,
	currentTime?: number,
): CFrame {
	const time = currentTime ?? Workspace.GetServerTimeNow();
	const progress = calculateEggProgress(egg.moveStartTime, time, speedHistory);

	// 使用线性插值计算位置
	return conveyorStartPosition.Lerp(conveyorEndPosition, progress);
}

/**
 * 获取传送带蛋的进度信息.
 *
 * @param egg - 传送带蛋.
 * @param speedHistory - 速度变化历史记录.
 * @param currentTime - 当前时间（可选，默认使用服务器时间）.
 * @returns 蛋进度信息.
 */
export function getEggProgressInfo(
	egg: ConveyorEgg,
	speedHistory: Array<SpeedHistoryEntry>,
	currentTime?: number,
): {
	isMissed: boolean;
	progress: number;
} {
	const time = currentTime ?? Workspace.GetServerTimeNow();
	const progress = calculateEggProgress(egg.moveStartTime, time, speedHistory);
	const isMissed = isEggMissed(egg.moveStartTime, time, speedHistory);

	return {
		isMissed,
		progress,
	};
}

/**
 * 批量获取多个蛋的进度信息.
 *
 * @param eggs - 传送带蛋数组.
 * @param speedHistory - 速度变化历史记录.
 * @param currentTime - 当前时间（可选，默认使用服务器时间）.
 * @returns 蛋进度信息数组.
 */
export function getBatchEggProgress(
	eggs: Array<ConveyorEgg>,
	speedHistory: Array<SpeedHistoryEntry>,
	currentTime?: number,
): Array<{
	egg: ConveyorEgg;
	isMissed: boolean;
	progress: number;
}> {
	const time = currentTime ?? Workspace.GetServerTimeNow();

	return eggs.map(egg => {
		const progressInfo = getEggProgressInfo(egg, speedHistory, time);

		return {
			egg,
			...progressInfo,
		};
	});
}
