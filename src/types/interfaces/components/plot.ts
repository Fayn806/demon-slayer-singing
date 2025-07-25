/** Plot 组件的属性接口. */
export interface PlotAttributes {
	/** 玩家ID. */
	playerId: string;
	/** Plot 编号 (1-8). */
	plotNumber: number;
}

/** Plot 模型接口. */
export interface PlotFolder extends Folder {
	/** 主要部件. */
	BeamPart: Part;
	/** 传送带系统. */
	Conveyor: {
		/** 传送带部件. */
		Belt: Model;
		/** 传送带终点. */
		Finish: Part;
		/** 错过的蛋存放区域. */
		MissedEggs: Folder;
		/** 生成点. */
		Spawn: Part;
	} & Model;
	/** 蛋相关文件夹. */
	Eggs: Folder;
	/** 扩展相关文件夹. */
	Expand: Folder;
	/** 岛屿1 - 主要游戏区域. */
	Island1: Model;
	/** 物品系统. */
	Items: Folder;
	/** 锁定区域. */
	Locked: Folder;
	/** 锁定传送门. */
	LockedPortal: Folder;
	/** 随机数生成器相关. */
	RNG: Folder;
	/** 标识系统. */
	Sign: Folder;
	/** 生成点配置. */
	Spawn: SpawnLocation;
}

/** Plot 数据类型. */
export interface PlotData {
	/** Plot 属性. */
	attributes: PlotAttributes;
	/** 当前收益. */
	currentEarnings: number;
	/** 最后更新时间. */
	lastUpdate: number;
	/** Plot 状态. */
	status: "locked" | "owned" | "unlocked";
	/** 解锁价格. */
	unlockPrice?: number;
}
