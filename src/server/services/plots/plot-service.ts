import { type OnStart, Service } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Workspace } from "@rbxts/services";

import type { PlayerEntity } from "server/services/player/player-entity";
import type { OnPlayerJoin, OnPlayerLeave } from "server/services/player/player-service";
import { store } from "server/store";
import { type ListenerData, setupLifecycle } from "shared/util/flamework-util";
import type { CharacterRig } from "shared/util/player-util";

import type { OnCharacterAdded } from "../player/character/character-service";

export interface OnPlayerPlotJoin {
	/**
	 * Fires when a player joins the game and their plot is initialized. This is
	 * called after the player entity is fully set up.
	 *
	 * @param playerEntity - The PlayerEntity instance of the player.
	 */
	onPlayerPlotJoin(playerEntity: PlayerEntity): void;
}

@Service({})
export class PlotService implements OnStart, OnPlayerJoin, OnPlayerLeave, OnCharacterAdded {
	private readonly plotJoinEvents = new Array<ListenerData<OnPlayerPlotJoin>>();

	constructor(private readonly logger: Logger) {}

	public onStart(): void {
		setupLifecycle<OnPlayerPlotJoin>(this.plotJoinEvents);
	}

	public onPlayerJoin(playerEntity: PlayerEntity): void {
		const { player, userId } = playerEntity;
		store.playerJoined(userId);
		this.logger.Info(
			`Player ${userId} has joined the game and their plot has been initialized.`,
		);

		// Notify all listeners that a player has joined their plot
		for (const { event } of this.plotJoinEvents) {
			event.onPlayerPlotJoin(playerEntity);
		}

		player.LoadCharacter();
		player.CharacterRemoving.Connect(() => {
			task.wait(1);

			if (!player.Parent) {
				return;
			}

			player.LoadCharacter();
		});
	}

	public onPlayerLeave(player: PlayerEntity): Promise<void> | void {
		const { userId } = player;
		store.playerLeft(userId);

		// Additional cleanup logic can be added here if needed
		this.logger.Info(`Player ${userId} has left the game and their plot has been cleaned up.`);
		return Promise.resolve();
	}

	public onCharacterAdded(character: CharacterRig, playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		this.logger.Info(`Character added for player ${userId}: ${character.Name}`);
		const playerPlot = store.getState().players[userId]?.plot;
		if (!playerPlot) {
			this.logger.Warn(`No plot found for player ${userId} when adding character.`);
			return;
		}

		const folder = Workspace.Main.Plots.FindFirstChild(tostring(playerPlot.index));
		if (!folder) {
			this.logger.Warn(
				`Plot folder not found for player ${userId} at index ${playerPlot.index}.`,
			);
			return;
		}

		// Additional logic for character addition can be added here
		const location = (folder as Folder & { Respawn: Part }).Respawn.CFrame;
		character.PivotTo(location);
	}
}
