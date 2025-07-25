import { Workspace } from "@rbxts/services";

import { CONVEYOR_CONSTANTS } from "shared/constants/game";
import type { ConveyorSpeedMode, SpeedHistoryEntry } from "shared/store/players/types";
import type { ConveyorConfig, ConveyorEgg } from "shared/types";

/**
 * 计算传送带配置（基于速度）.
 *
 * @param speed - 传送带速度倍数.
 * @returns 传送带配置.
 */
export function getConveyorConfig(speed: number): ConveyorConfig {
	/** 防止除零. */
	const effectiveSpeed = math.max(speed, 0.1);

	return {
		length: CONVEYOR_CONSTANTS.BASE_LENGTH,
		moveTime: CONVEYOR_CONSTANTS.BASE_MOVE_TIME / effectiveSpeed,
		speedMultiplier: effectiveSpeed,
	};
}

/**
 * 计算蛋在传送带上的移动进度（0-1）. 基于速度历史记录计算蛋的准确移动进度，考虑了蛋在移动过程中传送带速度的所有变化.
 *
 * @param eggMoveStartTime - 蛋开始移动的时间.
 * @param currentTime - 当前时间（可选，默认使用服务器时间）.
 * @param speedHistory - 速度变化历史记录（按时间排序）.
 * @param currentSpeed - 当前传送带速度.
 * @returns 进度百分比（0-1）.
 */
export function calculateEggProgress(
	eggMoveStartTime: number,
	currentTime: number | undefined,
	speedHistory: Array<SpeedHistoryEntry>,
	currentSpeed: ConveyorSpeedMode,
): number {
	const time = currentTime ?? Workspace.GetServerTimeNow();

	// 如果蛋还没开始移动
	if (time <= eggMoveStartTime) {
		return 0;
	}

	// 如果没有速度历史，使用当前速度进行简单计算
	if (speedHistory.size() === 0) {
		const elapsed = time - eggMoveStartTime;
		const config = getConveyorConfig(currentSpeed);
		const progress = elapsed / config.moveTime;
		return math.max(0, math.min(1, progress));
	}

	// 过滤出蛋开始移动后的速度变化
	const relevantSpeedChanges = speedHistory.filter(entry => entry.time > eggMoveStartTime);

	// 确定蛋开始移动时的初始速度
	let initialSpeed = currentSpeed;
	for (let index = speedHistory.size() - 1; index >= 0; index--) {
		const entry = speedHistory[index];
		if (entry && entry.time <= eggMoveStartTime) {
			initialSpeed = entry.speedMode;
			break;
		}
	}

	// 如果蛋开始移动后没有速度变化，使用初始速度计算
	if (relevantSpeedChanges.size() === 0) {
		const elapsed = time - eggMoveStartTime;
		const config = getConveyorConfig(initialSpeed);
		const progress = elapsed / config.moveTime;
		return math.max(0, math.min(1, progress));
	}

	let totalProgress = 0;
	let lastTime = eggMoveStartTime;
	let currentSegmentSpeed = initialSpeed;

	// 逐段计算每个速度区间的进度
	for (const speedChange of relevantSpeedChanges) {
		const segmentTime = speedChange.time - lastTime;
		const segmentConfig = getConveyorConfig(currentSegmentSpeed);
		const segmentProgress = segmentTime / segmentConfig.moveTime;

		totalProgress += segmentProgress;

		// 如果已经完成移动，直接返回
		if (totalProgress >= 1) {
			return 1;
		}

		lastTime = speedChange.time;
		currentSegmentSpeed = speedChange.speedMode;
	}

	// 计算最后一段（从最后一次速度变化到当前时间）
	const finalSegmentTime = time - lastTime;
	const finalConfig = getConveyorConfig(currentSegmentSpeed);
	const finalProgress = finalSegmentTime / finalConfig.moveTime;

	totalProgress += finalProgress;

	return math.max(0, math.min(1, totalProgress));
}

/**
 * 检查蛋是否已经错过（掉落）.
 *
 * @param eggMoveStartTime - 蛋开始移动的时间.
 * @param currentTime - 当前时间（可选，默认使用服务器时间）.
 * @param speedHistory - 速度变化历史记录.
 * @param currentSpeed - 当前传送带速度.
 * @returns 是否已错过.
 */
export function isEggMissed(
	eggMoveStartTime: number,
	currentTime: number | undefined,
	speedHistory: Array<SpeedHistoryEntry>,
	currentSpeed: ConveyorSpeedMode,
): boolean {
	const progress = calculateEggProgress(
		eggMoveStartTime,
		currentTime,
		speedHistory,
		currentSpeed,
	);
	return progress >= CONVEYOR_CONSTANTS.EGG_DROP_POSITION;
}

/**
 * 计算蛋在传送带上的实际位置（世界坐标）. 基于速度历史记录计算精确位置.
 *
 * @param egg - 传送带蛋.
 * @param speedHistory - 速度变化历史记录.
 * @param currentSpeed - 当前传送带速度.
 * @param conveyorStartPosition - 传送带起始位置.
 * @param conveyorEndPosition - 传送带结束位置.
 * @param currentTime - 当前时间（可选，默认使用服务器时间）.
 * @returns 蛋的当前世界位置.
 */
export function calculateEggWorldPosition(
	egg: ConveyorEgg,
	speedHistory: Array<SpeedHistoryEntry>,
	currentSpeed: ConveyorSpeedMode,
	conveyorStartPosition: Vector3,
	conveyorEndPosition: Vector3,
	currentTime?: number,
): Vector3 {
	const time = currentTime ?? Workspace.GetServerTimeNow();
	const progress = calculateEggProgress(egg.moveStartTime, time, speedHistory, currentSpeed);

	// 使用线性插值计算位置
	return conveyorStartPosition.Lerp(conveyorEndPosition, progress);
}

/**
 * 获取传送带蛋的进度信息.
 *
 * @param egg - 传送带蛋.
 * @param speedHistory - 速度变化历史记录.
 * @param currentSpeed - 当前传送带速度.
 * @param currentTime - 当前时间（可选，默认使用服务器时间）.
 * @returns 蛋进度信息.
 */
export function getEggProgressInfo(
	egg: ConveyorEgg,
	speedHistory: Array<SpeedHistoryEntry>,
	currentSpeed: ConveyorSpeedMode,
	currentTime?: number,
): {
	currentSpeed: ConveyorSpeedMode;
	isMissed: boolean;
	progress: number;
} {
	const time = currentTime ?? Workspace.GetServerTimeNow();
	const progress = calculateEggProgress(egg.moveStartTime, time, speedHistory, currentSpeed);
	const isMissed = isEggMissed(egg.moveStartTime, time, speedHistory, currentSpeed);

	return {
		currentSpeed,
		isMissed,
		progress,
	};
}

/**
 * 批量获取多个蛋的进度信息.
 *
 * @param eggs - 传送带蛋数组.
 * @param speedHistory - 速度变化历史记录.
 * @param currentSpeed - 当前传送带速度.
 * @param currentTime - 当前时间（可选，默认使用服务器时间）.
 * @returns 蛋进度信息数组.
 */
export function getBatchEggProgress(
	eggs: Array<ConveyorEgg>,
	speedHistory: Array<SpeedHistoryEntry>,
	currentSpeed: ConveyorSpeedMode,
	currentTime?: number,
): Array<{
	currentSpeed: ConveyorSpeedMode;
	egg: ConveyorEgg;
	isMissed: boolean;
	progress: number;
}> {
	const time = currentTime ?? Workspace.GetServerTimeNow();

	return eggs.map(egg => {
		const progressInfo = getEggProgressInfo(egg, speedHistory, currentSpeed, time);

		return {
			egg,
			...progressInfo,
		};
	});
}
