import type { OnStart } from "@flamework/core";
import { Service } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Workspace } from "@rbxts/services";

import type { PlayerEntity } from "server/services/player/player-entity";
import type { PlayerService } from "server/services/player/player-service";
import type { RootStore } from "server/store";
import { remotes } from "shared/remotes";
import { selectInventoryItemById, selectPlayerState } from "shared/store/players/selectors";
import { ItemType, type PlacedEgg, type PlacedPet, type PlayerPlacedItem } from "shared/types";
import { generateUniqueId } from "shared/util/id-util";

@Service({})
export class ItemService implements OnStart {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly playerService: PlayerService,
	) {}

	/** @ignore */
	public onStart(): void {
		remotes.plot.placeItem.onRequest(
			this.playerService.withPlayerEntity((playerEntity, itemInstanceId, location) => {
				return this.placeItem(playerEntity, itemInstanceId, location);
			}),
		);

		remotes.plot.hatchEgg.onRequest(
			this.playerService.withPlayerEntity((playerEntity, eggInstanceId) =>
				this.hatchEgg(playerEntity, eggInstanceId),
			),
		);

		remotes.plot.hatchEggComplete.onRequest(
			this.playerService.withPlayerEntity((playerEntity, eggInstanceId) =>
				this.hatchEggComplete(playerEntity, eggInstanceId),
			),
		);

		remotes.plot.pickPet.onRequest(
			this.playerService.withPlayerEntity((playerEntity, itemInstanceId) =>
				this.pickPet(playerEntity, itemInstanceId),
			),
		);
	}

	/**
	 * 放置物品到指定位置.
	 *
	 * @param playerEntity - 玩家实体.
	 * @param itemInstanceId - 物品实例ID.
	 * @param location - 放置位置的CFrame.
	 * @returns 是否成功放置物品.
	 */
	public placeItem(
		playerEntity: PlayerEntity,
		itemInstanceId: string,
		location: CFrame,
	): boolean {
		const { userId } = playerEntity;
		const playerState = this.store.getState(selectPlayerState(userId));

		if (!playerState) {
			this.logger.Warn(`Player state not found for ID: ${userId}`);
			return false;
		}

		// 检查物品是否可以放置
		const item = this.store.getState(selectInventoryItemById(userId, itemInstanceId));
		if (!item) {
			this.logger.Warn(`Item with ID ${itemInstanceId} not found.`);
			return false;
		}

		let placedItem: PlayerPlacedItem | undefined;
		const currentTime = Workspace.GetServerTimeNow();
		if (item.itemType === ItemType.Egg) {
			// 默认值，实际使用时可能需要根据具体逻辑计算
			placedItem = {
				eggId: item.eggId,
				hatchLeftTime: 10,
				instanceId: generateUniqueId("placedEgg"),
				itemType: ItemType.Egg,
				location,
				mutations: [],
				placedTime: currentTime,
				sizeBonus: 0,
				type: item.type,
			} as PlacedEgg;
		} else if (item.itemType === ItemType.Pet) {
			placedItem = {
				earningsType: "coins",
				eggId: item.eggId,
				hatchTime: currentTime,
				instanceId: generateUniqueId("placedPet"),
				itemType: ItemType.Pet,
				lastClaimTime: 0,
				location,
				luckBonus: item.luckBonus,
				mutations: item.mutations,
				petId: item.petId,
				placedEarnings: 0,
				placedTime: currentTime,
				sizeBonus: item.sizeBonus,
				totalEarnings: item.totalEarnings,
				type: item.type,
			} as PlacedPet;
		} else {
			this.logger.Warn(`Item type ${item.itemType} is not supported for placement.`);
			return false;
		}

		// 执行放置逻辑
		// 这里可以添加更多的逻辑来处理放置物品的细节
		this.store.placeItemFromInventory(userId, placedItem);
		if (item.itemType === ItemType.Egg) {
			this.store.removeEggFromInventory(userId, itemInstanceId, 1);
		} else if (item.itemType === ItemType.Pet) {
			this.store.removeItemFromInventory(userId, itemInstanceId);
		}

		this.logger.Info(`Item ${itemInstanceId} placed at ${location}`);
		return true;
	}

	/**
	 * 孵化蛋的逻辑.
	 *
	 * @param playerEntity - 玩家实体.
	 * @param eggInstanceId - 蛋的实例ID.
	 * @returns 是否成功孵化蛋.
	 */
	public hatchEgg(playerEntity: PlayerEntity, eggInstanceId: string): boolean {
		const { userId } = playerEntity;
		const playerState = this.store.getState(selectPlayerState(userId));

		if (!playerState) {
			this.logger.Warn(`Player state not found for ID: ${userId}`);
			return false;
		}

		const currentIslandId = playerState.plot.islandId;
		const egg = playerState.islands[currentIslandId]?.placed.find(
			item => item.instanceId === eggInstanceId && item.itemType === ItemType.Egg,
		);

		if (!egg) {
			this.logger.Warn(`Egg with instance ID ${eggInstanceId} not found.`);
			return false;
		}

		return true;
	}

	/**
	 * 完成蛋的孵化.
	 *
	 * @param playerEntity - 玩家实体.
	 * @param eggInstanceId - 蛋的实例ID.
	 * @returns 是否成功完成孵化.
	 */
	public hatchEggComplete(playerEntity: PlayerEntity, eggInstanceId: string): boolean {
		const { userId } = playerEntity;
		const playerState = this.store.getState(selectPlayerState(userId));

		if (!playerState) {
			this.logger.Warn(`Player state not found for ID: ${userId}`);
			return false;
		}

		const currentIslandId = playerState.plot.islandId;
		const egg = playerState.islands[currentIslandId]?.placed.find(
			item => item.instanceId === eggInstanceId && item.itemType === ItemType.Egg,
		) as PlacedEgg | undefined;

		if (!egg) {
			this.logger.Warn(`Egg with instance ID ${eggInstanceId} not found.`);
			return false;
		}

		// 删除placedEgg
		this.store.removePlacedEgg(userId, eggInstanceId);
		// 添加PlacedPet
		const newPlacedPet: PlacedPet = {
			earningsType: "coins",
			eggId: egg.eggId,
			hatchTime: Workspace.GetServerTimeNow(),
			instanceId: generateUniqueId("pet"),
			itemType: ItemType.Pet,
			lastClaimTime: 0,
			location: egg.location,
			luckBonus: egg.luckBonus,
			mutations: egg.mutations,
			petId: "2",
			placedEarnings: 0,
			placedTime: Workspace.GetServerTimeNow(),
			sizeBonus: egg.sizeBonus,
			totalEarnings: 0,
			type: egg.type,
		};
		// 将新宠物放置到玩家的岛屿上
		this.store.placeItem(userId, newPlacedPet);

		this.logger.Info(`Egg ${eggInstanceId} hatched successfully.`);
		return true;
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
}
