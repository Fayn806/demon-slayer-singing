import { Service } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Workspace } from "@rbxts/services";

import type { PlayerEntity } from "server/services/player/player-entity";
import type { RootStore } from "server/store";
import type { Configs } from "shared/configs";
import { selectPlayerState } from "shared/store/players/selectors";
import { ItemType, type PlacedEgg, type PlacedPet, type PlayerEgg } from "shared/types";
import { generateUniqueId } from "shared/util/id-util";

@Service({})
export class EggService {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly configs: Configs,
	) {}

	public placeEgg(playerEntity: PlayerEntity, playerEgg: PlayerEgg, location: CFrame): void {
		const { userId } = playerEntity;
		// 默认值，实际使用时可能需要根据具体逻辑计算
		const currentTime = Workspace.GetServerTimeNow();
		const placedItem = {
			eggId: playerEgg.eggId,
			hatchLeftTime: this.configs.EggsConfig[playerEgg.eggId].hatchTime,
			instanceId: generateUniqueId("placedEgg"),
			itemType: ItemType.Egg,
			location,
			luckBonus: 0,
			mutations: playerEgg.mutations,
			placedTime: currentTime,
			sizeBonus: 0,
		} as PlacedEgg;

		this.store.placeItemFromInventory(userId, placedItem);
		this.store.removeEggFromInventory(userId, playerEgg.instanceId, 1);
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
		const currentTime = Workspace.GetServerTimeNow();
		// 添加PlacedPet
		const newPlacedPet: PlacedPet = {
			currentEarning: 0,
			earningsType: "coins",
			earningTime: currentTime,
			eggId: egg.eggId,
			hatchTime: currentTime,
			instanceId: generateUniqueId("pet"),
			itemType: ItemType.Pet,
			location: egg.location,
			luckBonus: egg.luckBonus,
			mutations: egg.mutations,
			petId: "2",
			placedTime: Workspace.GetServerTimeNow(),
			sizeBonus: egg.sizeBonus,
			totalEarnings: 0,
		};
		// 将新宠物放置到玩家的岛屿上
		this.store.placeItem(userId, newPlacedPet);

		this.logger.Info(`Egg ${eggInstanceId} hatched successfully.`);
		return true;
	}
}
