import type { OnStart } from "@flamework/core";
import { Service } from "@flamework/core";
import { Janitor } from "@rbxts/janitor";
import type { Logger } from "@rbxts/log";
import { Workspace } from "@rbxts/services";

import type { PlayerService } from "server/services/player/player-service";
import type { RootStore } from "server/store";
import { remotes } from "shared/remotes";
import { selectPlacedItems } from "shared/store/players/selectors";
import { ItemType } from "shared/types";
import { calculateEarnings } from "shared/util/calculate-utils/earning";

import type { PlayerEntity } from "../../../player/player-entity";
import type { OnPlayerPlotJoin } from "../../plot-service";

@Service({})
export class EarningService implements OnStart, OnPlayerPlotJoin {
	private readonly playerJanitors = new Map<string, Janitor>();

	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly playerService: PlayerService,
	) {}

	/** @ignore */
	public onStart(): void {
		remotes.plot.claimPetEarings.onRequest(
			this.playerService.withPlayerEntity((playerEntity, itemInstanceId) => {
				return this.claimPetEarnings(playerEntity, itemInstanceId);
			}),
		);
	}

	public onPlayerPlotJoin(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		const janitor = new Janitor();
		janitor.Add(
			this.store.subscribe(
				selectPlacedItems(userId),
				(state, preState) => {
					const count1 = state.filter(item => item.itemType === ItemType.Booster).size();
					const count2 = preState
						.filter(item => item.itemType === ItemType.Booster)
						.size();
					return count1 !== count2;
				},
				() => {
					this.logger.Info(`Calculating earnings for player ${userId}.`);
					this.savePetsEarnings(playerEntity);
				},
			),
		);
		this.savePetsEarnings(playerEntity);

		this.playerJanitors.set(userId, janitor);
	}

	private savePetsEarnings(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		const playerPets = this.store.getState(selectPlacedItems(userId));

		const currentTime = Workspace.GetServerTimeNow();
		for (const pet of playerPets) {
			if (pet.itemType === ItemType.Pet) {
				// 假设有一个方法来保存宠物的收益
				const { currentEarning, earningTime, instanceId } = pet;
				const dt = math.floor(currentTime - earningTime);
				if (dt <= 0) {
					continue;
				}

				const newEarning = currentEarning + calculateEarnings(6, 1, 1, dt);
				// 保存收益逻辑...
				this.store.updatePetEarnings(userId, instanceId, {
					currentEarning: newEarning,
					earningTime: currentTime,
				});
			}
		}
	}

	private claimPetEarnings(playerEntity: PlayerEntity, itemInstanceId: string): boolean {
		const { userId } = playerEntity;
		const placedItems = this.store.getState(selectPlacedItems(userId));
		const placedItem = placedItems.find(item => item.instanceId === itemInstanceId);

		if (!placedItem || placedItem.itemType !== ItemType.Pet) {
			this.logger.Warn(`Placed item ${itemInstanceId} not found or is not a pet.`);
			return false;
		}

		const { currentEarning, earningTime } = placedItem;
		const currentTime = Workspace.GetServerTimeNow();
		const dt = math.floor(currentTime - earningTime);
		if (dt <= 0 && currentEarning <= 0) {
			this.logger.Warn(`No earnings to claim for pet ${itemInstanceId}.`);
			return false;
		}

		const earnings = calculateEarnings(6, 1, 1, dt);
		const claimedEarnings = currentEarning + earnings;

		this.logger.Info(
			`Claimed earnings for pet ${itemInstanceId} of player ${userId}: ${claimedEarnings}`,
		);

		this.store.updatePetEarnings(userId, itemInstanceId, {
			currentEarning: 0,
			earningTime: currentTime,
		});

		return true;
	}
}
