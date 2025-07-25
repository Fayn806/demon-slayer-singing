import type { Janitor } from "@rbxts/janitor";
import type { Document } from "@rbxts/lapis";

import { store } from "server/store";
import type { PlayerData } from "shared/store/persistent";
import type { PlayerState } from "shared/store/players/types";

export class PlayerEntity {
	/** The player's username. */
	public readonly name: string;
	/** A string representation of the player's UserId. */
	public readonly userId: string;

	constructor(
		public readonly player: Player,
		public readonly janitor: Janitor,
		public readonly document: Document<PlayerData>,
	) {
		this.name = player.Name;
		this.userId = tostring(player.UserId);
	}

	public getPlayerState(): PlayerState | undefined {
		const state = store.getState();

		const playerState = state.players[this.userId];
		if (!playerState) {
			return undefined;
		}

		return playerState;
	}
}
