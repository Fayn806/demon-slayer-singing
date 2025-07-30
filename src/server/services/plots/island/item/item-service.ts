import type { OnStart } from "@flamework/core";
import { Service } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Workspace } from "@rbxts/services";

import type { PlayerEntity } from "server/services/player/player-entity";
import type { PlayerService } from "server/services/player/player-service";
import type { RootStore } from "server/store";
import { remotes } from "shared/remotes";
import { selectInventoryItemById, selectPlayerState } from "shared/store/players/selectors";
import { ItemType, type PlacedEgg, type PlayerPlacedItem } from "shared/types";
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
	}

	/**
	 * 放置物品到指定位置.
	 *
	 * @param playerEntity
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
		if (item.itemType === ItemType.Egg) {
			// 默认值，实际使用时可能需要根据具体逻辑计算
			placedItem = {
				eggId: item.eggId,
				hatchLeftTime: 0,
				instanceId: generateUniqueId("placedEgg"),
				itemType: ItemType.Egg,
				location,
				mutations: [],
				placedTime: Workspace.GetServerTimeNow(),
				sizeBonus: 0,
				type: item.type,
			} as PlacedEgg;
		}

		if (placedItem === undefined) {
			this.logger.Warn(`Item type ${item.itemType} is not supported for placement.`);
			return false;
		}

		// 执行放置逻辑
		// 这里可以添加更多的逻辑来处理放置物品的细节
		this.store.placeItemFromInventory(userId, placedItem);
		if (item.itemType === ItemType.Egg) {
			this.store.removeEggFromInventory(userId, itemInstanceId, 1);
		}

		this.logger.Info(`Item ${itemInstanceId} placed at ${location}`);
		return true;
	}
}
