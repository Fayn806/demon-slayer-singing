import type { OnStart } from "@flamework/core";
import { Service } from "@flamework/core";
import type { Logger } from "@rbxts/log";

import type { PlayerEntity } from "server/services/player/player-entity";
import type { PlayerService } from "server/services/player/player-service";
import type { RootStore } from "server/store";
import { remotes } from "shared/remotes";
import { selectHeldItem } from "shared/store/players/selectors";

@Service({})
export class InventoryService implements OnStart {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly playerService: PlayerService,
	) {}

	/** @ignore */
	public onStart(): void {
		remotes.plot.switchHeldItemInstanceId.onRequest(
			this.playerService.withPlayerEntity((playerEntity, itemInstanceId) =>
				this.switchHeldItem(playerEntity, itemInstanceId),
			),
		);
	}

	private switchHeldItem(playerEntity: PlayerEntity, itemInstanceId: string): boolean {
		this.logger.Info(
			`Switching held item for player ${playerEntity.userId} to ${itemInstanceId}`,
		);

		this.store.setHeldItemInstanceId(playerEntity.userId, itemInstanceId);

		const current = this.store.getState(selectHeldItem(playerEntity.userId));
		return current?.instanceId === itemInstanceId;
	}
}
