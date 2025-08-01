import type { Logger } from "@rbxts/log";
import { Workspace } from "@rbxts/services";

import type { RootStore } from "client/store";
import type { PlayerEntity } from "server/services/player/player-entity";
import type { Configs } from "shared/configs";
import { selectPlacedEggsInRange } from "shared/store/players/selectors";
import type { PlacedBooster } from "shared/types";
import { createScheduler } from "shared/util/scheduler";

export class Booster {
	constructor(
		private readonly logger: Logger,
		private readonly store: RootStore,
		private readonly config: Configs["BoomboxesConfig"][string],
		private readonly placedBooster: PlacedBooster,
		private readonly playerEntity: PlayerEntity,
	) {
		this.setupLifecycle();
	}

	public Destroy(): void {
		// 清理生命周期
	}

	/** 应用加成效果. */
	private applyBoosterEffect(): void {
		const currentTime = Workspace.GetServerTimeNow();
		// 这里可以添加具体的加成效果逻辑
		const effectPlacedEggs = this.store.getState(
			selectPlacedEggsInRange(
				this.playerEntity.userId,
				this.placedBooster.location,
				this.config.radius,
			),
		);

		for (const egg of effectPlacedEggs) {
			// 处理每个放置的蛋，应用加成效果
			this.logger.Info(`Applying booster effect to egg ${egg.instanceId} in range.`);
			// 这里可以添加具体的加成逻辑，比如增加孵化速度等
			if (this.config.type === "Size") {
				// this.store.
			}

			const effectStartTime = math.max(egg.placedTime, this.placedBooster.placedTime);
			const effectDuration = math.min(
				currentTime - effectStartTime,
				this.config.duration ?? 0,
			);

			if (effectDuration > 0) {
				// 这里可以添加具体的加成效果逻辑
			}
		}
	}

	private setupLifecycle(): void {
		const { janitor, userId } = this.playerEntity;

		if (this.config.duration === undefined && this.config.INSTANT === true) {
			this.applyBoosterEffect();
		} else {
			const leftTime =
				this.placedBooster.placedTime +
				(this.config.duration ?? 0) -
				Workspace.GetServerTimeNow();
			// 监听放置的加成变化
			void janitor.AddPromise(
				Promise.delay(leftTime)
					.andThen(() => {
						this.store.removePlacedBooster(userId, this.placedBooster.instanceId);
						this.logger.Info(
							`Booster ${this.placedBooster.instanceId} for player ${userId} has expired.`,
						);
					})
					.catch(err => {
						this.logger.Error(`Error while handling booster lifecycle: ${err}`);
					}),
			);
			janitor.Add(
				createScheduler({
					name: this.placedBooster.instanceId,
					onTick: () => {
						this.applyBoosterEffect();
					},
					tick: 1,
				}),
			);
		}
	}
}
