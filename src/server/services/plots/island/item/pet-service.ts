import { type OnStart, Service } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Workspace } from "@rbxts/services";

import type { PlayerEntity } from "server/services/player/player-entity";
import type { PlayerService } from "server/services/player/player-service";
import type { RootStore } from "server/store";
import type { Configs } from "shared/configs";
import { remotes } from "shared/remotes";
import { selectPlacedItems, selectPlayerState } from "shared/store/players/selectors";
import { ItemType, type PlacedEgg, type PlacedPet, type PlayerPet } from "shared/types";
import { calculateEarnings } from "shared/util/calculate-utils/earning";
import { generateUniqueId } from "shared/util/id-util";

@Service({})
export class PetService implements OnStart {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly configs: Configs,
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

	public placePet(playerEntity: PlayerEntity, playerPet: PlayerPet, location: CFrame): void {
		const { userId } = playerEntity;
		// 默认值，实际使用时可能需要根据具体逻辑计算
		const currentTime = Workspace.GetServerTimeNow();
		const placedItem = {
			currentEarning: 0,
			earningsType: "coins",
			earningTime: currentTime,
			eggId: playerPet.eggId,
			hatchTime: currentTime,
			instanceId: generateUniqueId("placedPet"),
			itemType: ItemType.Pet,
			location,
			mutations: playerPet.mutations,
			petId: playerPet.petId,
			placedTime: currentTime,
			totalEarnings: playerPet.totalEarnings,
		} as PlacedPet;

		this.store.placeItemFromInventory(userId, placedItem);
	}

	public hatchPetFromEgg(playerEntity: PlayerEntity, placedEgg: PlacedEgg): void {
		const currentTime = Workspace.GetServerTimeNow();

		const newPlayerPet: PlayerPet = {
			bonuses: placedEgg.bonuses,
			eggId: placedEgg.eggId,
			hatchTime: currentTime,
			instanceId: generateUniqueId("pet"),
			itemType: ItemType.Pet,
			mutations: placedEgg.mutations,
			petId: "3",
			totalEarnings: 0,
		};

		this.placePet(playerEntity, newPlayerPet, placedEgg.location);
	}

	/**
	 * 处理物品拾取逻辑.
	 *
	 * @param playerEntity - 玩家实体.
	 * @param itemInstanceId - 物品实例ID.
	 * @returns 是否成功拾取物品.
	 */
	public pickPet(playerEntity: PlayerEntity, itemInstanceId: string): boolean {
		const { userId } = playerEntity;
		const playerState = this.store.getState(selectPlayerState(userId));

		if (!playerState) {
			this.logger.Warn(`Player state not found for ID: ${userId}`);
			return false;
		}

		const currentIslandId = playerState.plot.islandId;
		const item = playerState.islands[currentIslandId]?.placed.find(
			placedItem => placedItem.instanceId === itemInstanceId,
		);

		if (!item) {
			this.logger.Warn(`Item with instance ID ${itemInstanceId} not found.`);
			return false;
		}

		if (item.itemType !== ItemType.Pet) {
			return false;
		}

		this.store.pickPetToInventory(userId, itemInstanceId);
		this.logger.Info(`Item ${itemInstanceId} picked successfully.`);
		return true;
	}

	public savePetsEarnings(playerEntity: PlayerEntity): void {
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
