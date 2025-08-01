import { type OnStart, Service } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Workspace } from "@rbxts/services";

import type { PlayerEntity } from "server/services/player/player-entity";
import type { PlayerService } from "server/services/player/player-service";
import type { OnPlayerPlotJoin } from "server/services/plots/plot-service";
import type { RootStore } from "server/store";
import type { Configs } from "shared/configs";
import { selectPlacedEggsInRange, selectPlacedItems } from "shared/store/players/selectors";
import {
	BonusType,
	ItemType,
	type PlacedBooster,
	type PlacedEgg,
	type PlayerBooster,
} from "shared/types";

@Service({})
export class BoosterService implements OnStart, OnPlayerPlotJoin {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly configs: Configs,
		private readonly playerService: PlayerService,
	) {}

	public onStart(): void {
		// 监听放置加成的请求
	}

	public placeBooster(
		playerEntity: PlayerEntity,
		playerBooster: PlayerBooster,
		location: CFrame,
	): void {
		const { userId } = playerEntity;
		const boosterConfig = this.configs.BoomboxesConfig[playerBooster.boosterId];
		if (!boosterConfig) {
			this.logger.Error(`Booster config not found for ID: ${playerBooster.boosterId}`);
			return;
		}

		const placedItem = {
			boosterId: playerBooster.boosterId,
			instanceId: playerBooster.instanceId,
			itemType: ItemType.Booster,
			location,
			placedTime: Workspace.GetServerTimeNow(),
		} as PlacedBooster;

		this.store.placeItemFromInventory(userId, placedItem);
		this.setupBoosterLifecycle(playerEntity, placedItem);
	}

	public onPlayerPlotJoin(playerEntity: PlayerEntity): void {
		const { janitor, userId } = playerEntity;
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
					this.updatePlayerBoosters(playerEntity);
				},
			),
		);

		this.updatePlayerBoosters(playerEntity);
	}

	public savePlacedEggsBonuses(playerEntity: PlayerEntity): void {
		// 保存加成效果到放置的蛋
		const placedItems = this.store.getState(selectPlacedItems(playerEntity.userId));
		const placedBoosters = placedItems.filter(item => item.itemType === ItemType.Booster);
		const eggEffects = new Map<PlacedEgg, Array<PlacedBooster>>();

		for (const placedBooster of placedBoosters) {
			const boosterConfig = this.configs.BoomboxesConfig[placedBooster.boosterId];
			if (!boosterConfig) {
				this.logger.Error(`Booster config not found for ID: ${placedBooster.boosterId}`);
				continue;
			}

			const effectPlacedEggs = this.store.getState(
				selectPlacedEggsInRange(
					playerEntity.userId,
					placedBooster.location,
					boosterConfig.radius,
				),
			);

			for (const egg of effectPlacedEggs) {
				if (!eggEffects.has(egg)) {
					eggEffects.set(egg, []);
				}

				eggEffects.get(egg)?.push(placedBooster);
			}
		}

		for (const [egg, boosters] of eggEffects) {
			this.logger.Info(
				`Applying ${boosters.size()} boosters to egg ${egg.instanceId} for player ${playerEntity.userId}.`,
			);
			const applied = this.savePlacedEggBonuses(playerEntity, egg, boosters);
			if (applied) {
				this.logger.Info(`Boosters applied to egg ${egg.instanceId} successfully.`);
			} else {
				this.logger.Warn(`Failed to apply boosters to egg ${egg.instanceId}.`);
			}
		}
	}

	private savePlacedEggBonuses(
		playerEntity: PlayerEntity,
		placedEgg: PlacedEgg,
		placedBoosters: Array<PlacedBooster>,
	): boolean {
		let applied = false;
		for (const placedBooster of placedBoosters) {
			const boosterConfig = this.configs.BoomboxesConfig[placedBooster.boosterId];
			if (!boosterConfig) {
				this.logger.Error(`Booster config not found for ID: ${placedBooster.boosterId}`);
				continue;
			}

			applied ||= this.applyBoosterEffectToEgg(placedEgg, placedBooster);
			if (applied) {
				this.logger.Info(
					`Booster ${placedBooster.instanceId} applied to egg ${placedEgg.instanceId}.`,
				);
			} else {
				this.logger.Warn(
					`Failed to apply booster ${placedBooster.instanceId} to egg ${placedEgg.instanceId}.`,
				);
			}
		}

		return applied;
	}

	private applyBoosterEffectToEgg(placedEgg: PlacedEgg, placedBooster: PlacedBooster): boolean {
		const currentTime = Workspace.GetServerTimeNow();
		const boosterConfig = this.configs.BoomboxesConfig[placedBooster.boosterId];
		if (!boosterConfig) {
			this.logger.Error(`Booster config not found for ID: ${placedBooster.boosterId}`);
			return false;
		}

		const { bonuses, bonusUpdateTime } = placedEgg;
		const { instanceId, placedTime } = placedBooster;
		const bonusStartTime = math.max(bonusUpdateTime, placedTime);

		const second = math.floor(
			math.min(placedTime + (boosterConfig.duration ?? 0), currentTime) - bonusStartTime,
		);
		if (second <= 0) {
			return false;
		}

		const newBonuses = [...bonuses];
		// 这里可以添加具体的加成效果逻辑
		if (boosterConfig.type === "Size") {
			const additionPerSecond = boosterConfig.perSecond ?? 0;
			const maxBoost = boosterConfig.maxBoost ?? 0;
			if (additionPerSecond <= 0 || maxBoost <= 0) {
				return false;
			}

			// 假设加成是增加蛋的大小
			const existingBonus = newBonuses.find(bonus => bonus.fromInstanceId === instanceId);
			if (existingBonus) {
				existingBonus.value += additionPerSecond * second;
			} else {
				newBonuses.push({
					fromInstanceId: instanceId,
					type: BonusType[boosterConfig.type],
					value: additionPerSecond * second,
				});
			}

			this.logger.Info(
				`Applied size booster ${instanceId} to egg ${placedEgg.instanceId} with value ${additionPerSecond * second}.`,
			);
		}

		return true;
	}

	private updatePlayerBoosters(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		const placedItems = this.store.getState(selectPlacedItems(userId));
		const boosters = placedItems.filter(item => item.itemType === ItemType.Booster);

		if (boosters.size() > 0) {
			this.logger.Info(`Player ${userId} has ${boosters.size()} boosters placed.`);
		} else {
			this.logger.Info(`Player ${userId} has no boosters placed.`);
		}

		// 这里可以添加更多逻辑来处理加成效果等
	}

	private setupBoosterLifecycle(playerEntity: PlayerEntity, placedBooster: PlacedBooster): void {
		const { janitor, userId } = playerEntity;
		const boosterConfig = this.configs.BoomboxesConfig[placedBooster.boosterId];
		if (!boosterConfig) {
			this.logger.Error(`Booster config not found for ID: ${placedBooster.boosterId}`);
			return;
		}

		// 创建加成实例并应用效果
		const leftTime =
			placedBooster.placedTime + (boosterConfig.duration ?? 0) - Workspace.GetServerTimeNow();
		void janitor.AddPromise(
			Promise.delay(leftTime)
				.andThen(() => {
					this.savePlacedEggsBonuses(playerEntity);
					// 移除放置的加成
					this.store.removePlacedBooster(userId, placedBooster.instanceId);
					this.logger.Info(
						`Booster ${placedBooster.instanceId} for player ${userId} has expired.`,
					);
				})
				.catch(err => {
					this.logger.Error(`Error while handling booster lifecycle: ${err}`);
				}),
		);
	}
}
