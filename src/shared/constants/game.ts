export const CONVEYOR_CONSTANTS = {
	/** 传送带基础长度（studs）. */
	BASE_LENGTH: 50,

	/** 传送带基础移动时间（秒）. */
	BASE_MOVE_TIME: 10,

	/** 蛋掉落的位置百分比（0-1）. */
	EGG_DROP_POSITION: 1,

	/** 蛋移动时间延迟（秒）. */
	EGG_MOVE_DELAY: 0.2,

	/** 传送带保留错过的蛋最大数量. */
	MAX_MISSED_EGGS: 10,

	/** 错过的蛋保留时间（秒）. */
	MISSED_EGG_RESERVE_TIME: 30,

	/** 速度变化的平滑时间（秒）- 避免速度突变造成的视觉抖动. */
	SPEED_TRANSITION_TIME: 0.5,
} as const;

export const EGG_MOVE_DURATION_CONSTANTS = {
	FAST: 7.5,
	NORMAL: 10,
	SLOW: 30,
} as const;

/** 游戏循环的持续时间（秒）. */
export const LOOP_DURATION = 0.1;
