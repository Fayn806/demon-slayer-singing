import { Service, type OnStart } from "@flamework/core";
import type { Logger } from "@rbxts/log";

import type { PlayerEntity } from "server/services/player/player-entity";
import { store } from "server/store";
import { setupLifecycle, type ListenerData } from "shared/util/flamework-util";

import type { OnPlayerPlotJoin } from "../plot-service";

export interface OnPlayerIslandLoad {
	/**
	 * Fires when a player joins the game and their island is initialized or
	 * reloaded. This is called after the player entity is fully set up.
	 *
	 * @param playerEntity - The PlayerEntity instance of the player.
	 */
	onPlayerIslandLoad(playerEntity: PlayerEntity): void;
}

@Service({})
export class IslandService implements OnStart, OnPlayerPlotJoin {
	private readonly islandLoadEvents = new Array<ListenerData<OnPlayerIslandLoad>>();

	constructor(private readonly logger: Logger) {}

    public onStart(): void {
        setupLifecycle<OnPlayerIslandLoad>(this.islandLoadEvents);
        this.logger.Info("IslandService has started and is ready to manage island loads.");
    }

	public onPlayerPlotJoin(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		this.logger.Info(`Player ${userId} has joined their island plot.`);

		// Notify all listeners that a player has joined their island
		for (const { event } of this.islandLoadEvents) {
			event.onPlayerIslandLoad(playerEntity);
		}
	}

	public playerSwitchIsland(playerEntity: PlayerEntity, islandId: string): void {
		const { userId } = playerEntity;
		this.logger.Info(`Player ${userId} is switching to island ${islandId}.`);
		// Logic to switch the player's island can be added here
		store.switchIsland(userId, islandId);

		// Notify all listeners that the player has switched islands
		for (const { event } of this.islandLoadEvents) {
			event.onPlayerIslandLoad(playerEntity);
		}
	}
}
