export const CONVEYOR_CONSTANTS = {
	/** 传送带基础长度（studs）. */
	BASE_LENGTH: 50,

	/** 传送带基础移动时间（秒）. */
	BASE_MOVE_TIME: 10,

	/** 蛋掉落的位置百分比（0-1）. */
	EGG_DROP_POSITION: 0.9,

	/** 错过的蛋保留时间（秒）. */
	MISSED_EGG_RESERVE_TIME: 30,

	/** 速度变化的平滑时间（秒）- 避免速度突变造成的视觉抖动. */
	SPEED_TRANSITION_TIME: 0.5,
} as const;
