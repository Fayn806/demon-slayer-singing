import type { OnStart } from "@flamework/core";
import { Service } from "@flamework/core";
import type { Logger } from "@rbxts/log";

import type { PlayerEntity } from "server/services/player/player-entity";
import type { PlayerService } from "server/services/player/player-service";
import type { RootStore } from "server/store";
import type { Configs } from "shared/configs";
import { remotes } from "shared/remotes";
import { selectInventoryItemById, selectPlayerState } from "shared/store/players/selectors";
import { ItemType } from "shared/types";

import type { EggService } from "./egg-service";
import type { PetService } from "./pet-service";

@Service({})
export class ItemService implements OnStart {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly playerService: PlayerService,
		private readonly configs: Configs,
		private readonly petService: PetService,
		private readonly eggService: EggService,
	) {}

	/** @ignore */
	public onStart(): void {
		remotes.plot.placeItem.onRequest(
			this.playerService.withPlayerEntity((playerEntity, itemInstanceId, location) => {
				return this.placeItem(playerEntity, itemInstanceId, location);
			}),
		);

		remotes.plot.hatchEgg.onRequest(
			this.playerService.withPlayerEntity((playerEntity, eggInstanceId) => {
				return this.eggService.hatchEgg(playerEntity, eggInstanceId);
			}),
		);

		remotes.plot.hatchEggComplete.onRequest(
			this.playerService.withPlayerEntity((playerEntity, eggInstanceId) => {
				return this.eggService.hatchEggComplete(playerEntity, eggInstanceId);
			}),
		);

		remotes.plot.pickPet.onRequest(
			this.playerService.withPlayerEntity((playerEntity, itemInstanceId) => {
				return this.petService.pickPet(playerEntity, itemInstanceId);
			}),
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

		if (item.itemType === ItemType.Egg) {
			// 默认值，实际使用时可能需要根据具体逻辑计算
			this.eggService.placeEgg(playerEntity, item, location);
			return true;
		}

		if (item.itemType === ItemType.Pet) {
			this.petService.placePet(playerEntity, item, location);
			return true;
		}

		this.logger.Warn(`Item type ${item.itemType} is not supported for placement.`);
		return false;
	}
}
