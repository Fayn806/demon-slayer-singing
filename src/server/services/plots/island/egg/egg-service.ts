import { Service } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Workspace } from "@rbxts/services";

import type { PlayerEntity } from "server/services/player/player-entity";
import { store } from "server/store";
import { CONVEYOR_CONSTANTS } from "shared/constants/conveyor";
import type { ConveyorEgg, MissedEgg } from "shared/types";
import { ItemType } from "shared/types";
import { isEggMissed } from "shared/util/egg-util";

import type { OnPlayerIslandLoad } from "../island-service";

@Service({})
export class EggService implements OnPlayerIslandLoad {
	/** 基础蛋生成间隔（秒），会根据传送带速度调整. */
	private readonly baseEggGenerationInterval = 5;
	private readonly playersEggGenerating = new Map<PlayerEntity, thread>();

	constructor(private readonly logger: Logger) {}

	public onPlayerIslandLoad(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		this.logger.Info(`Player ${userId} has loaded their island, resetting egg generation.`);

		// 每次加载岛屿时都重置蛋生成
		this.stopEggGeneration(playerEntity);
		this.startEggGeneration(playerEntity);
	}

	public onPlayerIslandUnload(playerEntity: PlayerEntity): void {
		this.stopEggGeneration(playerEntity);
	}

	/** 清理所有玩家的蛋生成. */
	public cleanup(): void {
		for (const [playerEntity, thread] of this.playersEggGenerating) {
			task.cancel(thread);
			this.logger.Info(`Cleaned up egg generation for player ${playerEntity.userId}.`);
		}

		this.playersEggGenerating.clear();
	}

	private startEggGeneration(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		this.logger.Info(`Starting egg generation for player ${userId}.`);

		const generationThread = task.spawn(() => {
			while (true) {
				// 检查并处理错过的蛋
				this.checkMissedEggs(playerEntity);

				// 检查是否需要生成新蛋
				const shouldGenerate = this.shouldGenerateEgg(playerEntity);
				if (shouldGenerate) {
					this.generatePlayerEgg(playerEntity);
				}

				// 等待一段时间再进行下一次检查
				task.wait(0.1);
			}
		});

		this.playersEggGenerating.set(playerEntity, generationThread);
	}

	private stopEggGeneration(playerEntity: PlayerEntity): void {
		const existingThread = this.playersEggGenerating.get(playerEntity);
		if (!existingThread) {
			return;
		}

		task.cancel(existingThread);
		this.playersEggGenerating.delete(playerEntity);
		this.logger.Info(`Stopped egg generation for player ${playerEntity.userId}.`);
	}

	private checkMissedEggs(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		const playerState = store.getState().players[userId];

		if (!playerState) {
			return;
		}

		const currentTime = Workspace.GetServerTimeNow();
		const { speedMode, speedModeHistory } = playerState.conveyor;
		const currentIslandState = playerState.islands[playerState.plot.islandId];

		if (!currentIslandState) {
			return;
		}

		// 检查传送带上的蛋
		const missedEggs: Array<MissedEgg> = [];

		for (const egg of currentIslandState.eggs.conveyor) {
			if (isEggMissed(egg.moveStartTime, currentTime, speedModeHistory, speedMode)) {
				// 蛋已错过，转换为错过的蛋
				const missedEgg: MissedEgg = {
					...egg,
					// 错过后保留一段时间
					expireTime: currentTime + CONVEYOR_CONSTANTS.MISSED_EGG_RESERVE_TIME,
					isExpired: false,
					// 进入保留区的时间
					reserveTime: currentTime,
				};
				missedEggs.push(missedEgg);

				this.logger.Warn(`Player ${userId} missed egg ${egg.instanceId}`);
			}
		}

		// 如果有错过的蛋，更新状态
		if (missedEggs.size() > 0) {
			// 移动错过的蛋到 missed 数组，并从 conveyor 中移除
			for (const missedEgg of missedEggs) {
				store.moveEggToMissed(userId, missedEgg.instanceId, {
					expireTime: missedEgg.expireTime,
					reserveTime: missedEgg.reserveTime,
				});
			}
		}
	}

	private shouldGenerateEgg(playerEntity: PlayerEntity): boolean {
		const { userId } = playerEntity;
		const playerState = store.getState().players[userId];

		if (!playerState) {
			return false;
		}

		const { lastEggGenerationTime, speedMode: speed } = playerState.conveyor;
		const currentTime = Workspace.GetServerTimeNow();

		// 速度越高，生成间隔越短
		const dynamicInterval = this.baseEggGenerationInterval / math.max(speed, 0.1);

		return currentTime - lastEggGenerationTime >= dynamicInterval;
	}

	private generatePlayerEgg(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		this.logger.Info(`Generating egg for player ${userId}.`);

		const currentTime = Workspace.GetServerTimeNow();

		const conveyorEgg: ConveyorEgg = {
			eggId: "Egg1",
			instanceId: `egg_${userId}_${currentTime}`,
			itemType: ItemType.Egg,
			luckBonus: math.random(1, 10),
			moveStartTime: currentTime,
			mutations: [],
			placeRange: 5,
			sizeLuckBonus: math.random(1, 5),
			spawnTime: currentTime,
		};

		// 添加蛋到传送带（会自动更新lastEggGenerationTime）
		store.spawnEggOnConveyor(userId, conveyorEgg);

		this.logger.Info(`Generated egg ${conveyorEgg.instanceId} for player ${userId}.`);
	}
}
