import type { CharacterRig } from "shared/util/player-util";

/** 蛋组件的属性接口. */
export interface PlayerAttributes {
	/** 玩家ID. */
	playerId: string;
	/** 玩家名称. */
	playerName: string;
}

/** 蛋模型接口. */
export type PlayerModel = CharacterRig;
