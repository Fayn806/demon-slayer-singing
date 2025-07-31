import { type OnStart, Service } from "@flamework/core";
import type { Logger } from "@rbxts/log";
import { Workspace } from "@rbxts/services";

import type { PlayerEntity } from "server/services/player/player-entity";
import type { PlayerService } from "server/services/player/player-service";
import { store } from "server/store";
import { CONVEYOR_CONSTANTS, LOOP_DURATION } from "shared/constants/game";
import { remotes } from "shared/remotes";
import type { IslandState, PlayerState } from "shared/store/players/types";
import type { ConveyorEgg, EggId, MissedEgg } from "shared/types";
import { EggType, ItemType } from "shared/types";
import { isEggMissed } from "shared/util/egg-util";
import { generateUniqueId } from "shared/util/id-util";

import type { OnPlayerIslandLoad } from "../island-service";
import type { Configs } from "shared/configs";

@Service({})
export class ConveyorEggService implements OnStart, OnPlayerIslandLoad {
	/** 基础蛋生成间隔（秒），会根据传送带速度调整. */
	private readonly baseEggGenerationInterval = 3;
	/** 过期蛋清理间隔（秒）. */
	private readonly expiredEggCleanupInterval = 10;
	private readonly playersEggGenerating = new Map<PlayerEntity, thread>();
	private readonly playersLastCleanup = new Map<string, number>();

	constructor(
		private readonly logger: Logger,
		private readonly playerService: PlayerService,
		private readonly configs: Configs,
	) {}

	public onStart(): void {
		remotes.plot.buyConveyorEgg.onRequest(
			this.playerService.withPlayerEntity((playerEntity, eggInstanceId) => {
				return this.playerBuyConveyorEgg(playerEntity, eggInstanceId);
			}),
		);

		print(this.configs.EggsConfig)
	}

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
		this.playersLastCleanup.clear();
	}

	/**
	 * 手动在传送带上生成一个蛋.
	 *
	 * @param playerEntity - 玩家实体.
	 * @param eggId - 蛋的类型ID.
	 * @param customProperties - 自定义属性（可选）.
	 * @returns 生成的蛋对象.
	 */
	public spawnEgg(
		playerEntity: PlayerEntity,
		eggId: EggId,
		customProperties?: Partial<ConveyorEgg>,
	): ConveyorEgg {
		const { userId } = playerEntity;
		const conveyorEgg = this.createConveyorEgg(
			playerEntity,
			eggId,
			generateUniqueId("conveyorEgg"),
			customProperties,
		);

		store.spawnEggOnConveyor(userId, conveyorEgg);
		this.logger.Info(`Manually spawned egg ${conveyorEgg.instanceId} for player ${userId}.`);

		return conveyorEgg;
	}

	/**
	 * 移除传送带上的指定蛋（将其移动到错过区域）.
	 *
	 * @param playerEntity - 玩家实体.
	 * @param eggInstanceId - 蛋实例ID.
	 * @param reserveTime - 保留时间（秒），如果不指定则使用默认值.
	 * @returns 是否成功移除.
	 */
	public moveEggToMissed(
		playerEntity: PlayerEntity,
		eggInstanceId: string,
		reserveTime?: number,
	): boolean {
		const { userId } = playerEntity;
		const currentTime = Workspace.GetServerTimeNow();

		// 计算过期时间
		const defaultReserveTime = 30;
		const actualReserveTime = reserveTime ?? defaultReserveTime;
		const expireTime = currentTime + actualReserveTime;

		try {
			store.moveEggToMissed(userId, eggInstanceId, {
				expireTime,
				reserveTime: currentTime,
			});

			this.logger.Info(`Moved egg ${eggInstanceId} to missed area for player ${userId}.`);
			return true;
		} catch (err) {
			this.logger.Warn(
				`Failed to move egg ${eggInstanceId} to missed area for player ${userId}: ${err}`,
			);
			return false;
		}
	}

	/**
	 * 清理过期的错过蛋.
	 *
	 * @param playerEntity - 玩家实体.
	 * @returns 清理的蛋数量.
	 */
	public cleanupExpiredMissedEggs(playerEntity: PlayerEntity): number {
		const { userId } = playerEntity;
		const currentIslandState = this.getCurrentIslandState(userId);
		if (!currentIslandState) {
			return 0;
		}

		const beforeCount = currentIslandState.eggs.missed.size();
		store.cleanupExpiredMissedEggs(userId);

		// 重新获取状态以计算清理数量
		const updatedIslandState = this.getCurrentIslandState(userId);
		if (!updatedIslandState) {
			return 0;
		}

		const afterCount = updatedIslandState.eggs.missed.size();
		const cleanedCount = beforeCount - afterCount;

		if (cleanedCount > 0) {
			this.logger.Info(
				`Cleaned up ${cleanedCount} expired missed eggs for player ${userId}.`,
			);
		}

		return cleanedCount;
	}

	/**
	 * 获取玩家当前岛屿的所有传送带蛋.
	 *
	 * @param playerEntity - 玩家实体.
	 * @returns 传送带蛋数组.
	 */
	public getConveyorEggs(playerEntity: PlayerEntity): Array<ConveyorEgg> {
		const { userId } = playerEntity;
		const currentIslandState = this.getCurrentIslandState(userId);
		return currentIslandState?.eggs.conveyor ?? [];
	}

	/**
	 * 获取玩家当前岛屿的所有错过蛋.
	 *
	 * @param playerEntity - 玩家实体.
	 * @returns 错过蛋数组.
	 */
	public getMissedEggs(playerEntity: PlayerEntity): Array<MissedEgg> {
		const { userId } = playerEntity;
		const currentIslandState = this.getCurrentIslandState(userId);
		return currentIslandState?.eggs.missed ?? [];
	}

	/**
	 * 根据实例ID查找传送带蛋.
	 *
	 * @param playerEntity - 玩家实体.
	 * @param eggInstanceId - 蛋实例ID.
	 * @returns 蛋对象或undefined.
	 */
	public findConveyorEgg(
		playerEntity: PlayerEntity,
		eggInstanceId: string,
	): ConveyorEgg | undefined {
		const conveyorEggs = this.getConveyorEggs(playerEntity);
		return conveyorEggs.find(egg => egg.instanceId === eggInstanceId);
	}

	/**
	 * 根据实例ID查找错过蛋.
	 *
	 * @param playerEntity - 玩家实体.
	 * @param eggInstanceId - 蛋实例ID.
	 * @returns 错过蛋对象或undefined.
	 */
	public findMissedEgg(playerEntity: PlayerEntity, eggInstanceId: string): MissedEgg | undefined {
		const missedEggs = this.getMissedEggs(playerEntity);
		return missedEggs.find(egg => egg.instanceId === eggInstanceId);
	}

	/**
	 * 获取蛋的统计信息.
	 *
	 * @param playerEntity - 玩家实体.
	 * @returns 蛋统计信息.
	 */
	public getEggStats(playerEntity: PlayerEntity): {
		conveyorCount: number;
		lastGenerationTime: number;
		missedCount: number;
		totalGenerated: number;
	} {
		const { userId } = playerEntity;
		const playerState = this.getPlayerState(userId);

		if (!playerState) {
			return {
				conveyorCount: 0,
				lastGenerationTime: 0,
				missedCount: 0,
				totalGenerated: 0,
			};
		}

		const currentIslandState = this.getCurrentIslandState(userId);
		if (!currentIslandState) {
			return {
				conveyorCount: 0,
				lastGenerationTime: playerState.conveyor.lastEggGenerationTime,
				missedCount: 0,
				totalGenerated: 0,
			};
		}

		const conveyorCount = currentIslandState.eggs.conveyor.size();
		const missedCount = currentIslandState.eggs.missed.size();

		return {
			conveyorCount,
			lastGenerationTime: playerState.conveyor.lastEggGenerationTime,
			missedCount,
			totalGenerated: conveyorCount + missedCount,
		};
	}

	/**
	 * 创建一个ConveyorEgg对象的通用方法.
	 *
	 * @param _playerEntity - 玩家实体.
	 * @param eggId - 蛋类型ID.
	 * @param instanceId - 蛋实例ID.
	 * @param customProperties - 自定义属性（可选）.
	 * @returns 创建的ConveyorEgg对象.
	 */
	private createConveyorEgg(
		_playerEntity: PlayerEntity,
		eggId: EggId,
		instanceId: string,
		customProperties?: Partial<ConveyorEgg>,
	): ConveyorEgg {
		const currentTime = Workspace.GetServerTimeNow();

		const baseEgg: ConveyorEgg = {
			eggId,
			instanceId,
			itemType: ItemType.Egg,
			moveStartTime: currentTime + CONVEYOR_CONSTANTS.EGG_MOVE_DELAY,
			spawnTime: currentTime,
			type: EggType.Normal,
		};

		// 应用自定义属性
		return customProperties ? { ...baseEgg, ...customProperties } : baseEgg;
	}

	/**
	 * 获取玩家状态的通用方法.
	 *
	 * @param userId - 玩家用户ID.
	 * @returns 玩家状态或undefined.
	 */
	private getPlayerState(userId: string): PlayerState | undefined {
		return store.getState().players[userId];
	}

	/**
	 * 获取玩家当前岛屿状态的通用方法.
	 *
	 * @param userId - 玩家用户ID.
	 * @returns 当前岛屿状态或undefined.
	 */
	private getCurrentIslandState(userId: string): IslandState | undefined {
		const playerState = this.getPlayerState(userId);
		if (!playerState) {
			return;
		}

		return playerState.islands[playerState.plot.islandId];
	}

	private startEggGeneration(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		this.logger.Info(`Starting egg generation for player ${userId}.`);

		const generationThread = task.spawn(() => {
			while (true) {
				const currentTime = Workspace.GetServerTimeNow();

				// 检查并处理错过的蛋
				this.checkMissedEggs(playerEntity);

				// 定期检查并清理过期的错过蛋（避免过于频繁的清理）
				const lastCleanupTime = this.playersLastCleanup.get(userId) ?? 0;
				if (currentTime - lastCleanupTime >= this.expiredEggCleanupInterval) {
					const cleanedCount = this.cleanupExpiredMissedEggs(playerEntity);
					if (cleanedCount > 0) {
						this.logger.Debug(
							`Cleaned ${cleanedCount} expired eggs for player ${userId} in generation thread.`,
						);
					}

					this.playersLastCleanup.set(userId, currentTime);
				}

				// 检查是否需要生成新蛋
				const shouldGenerate = this.shouldGenerateEgg(playerEntity);
				if (shouldGenerate) {
					this.generatePlayerEgg(playerEntity);
				}

				// 等待一段时间再进行下一次检查
				task.wait(LOOP_DURATION);
			}
		});

		this.playersEggGenerating.set(playerEntity, generationThread);
	}

	private stopEggGeneration(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		const existingThread = this.playersEggGenerating.get(playerEntity);
		if (!existingThread) {
			return;
		}

		task.cancel(existingThread);
		this.playersEggGenerating.delete(playerEntity);
		this.playersLastCleanup.delete(userId);
		this.logger.Info(`Stopped egg generation for player ${userId}.`);
	}

	private checkMissedEggs(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		const playerState = this.getPlayerState(userId);

		if (!playerState) {
			return;
		}

		const currentTime = Workspace.GetServerTimeNow();
		const { speedModeHistory } = playerState.conveyor;
		const currentIslandState = this.getCurrentIslandState(userId);

		if (!currentIslandState) {
			return;
		}

		// 检查传送带上的蛋
		const missedEggs: Array<MissedEgg> = [];

		for (const egg of currentIslandState.eggs.conveyor) {
			if (isEggMissed(egg.moveStartTime, currentTime, speedModeHistory)) {
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
		const playerState = this.getPlayerState(userId);

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

		const conveyorEgg = this.createConveyorEgg(
			playerEntity,
			"Egg1" as EggId,
			generateUniqueId("conveyorEgg"),
		);

		// 添加蛋到传送带（会自动更新lastEggGenerationTime）
		store.spawnEggOnConveyor(userId, conveyorEgg);

		// this.logger.Info(`Generated egg ${conveyorEgg.instanceId} for player ${userId}.`);
	}

	private playerBuyConveyorEgg(playerEntity: PlayerEntity, eggInstanceId: string): boolean {
		const { userId } = playerEntity;
		const currentIslandState = this.getCurrentIslandState(userId);
		if (!currentIslandState) {
			this.logger.Warn(`Player ${userId} has no current island state.`);
			return false;
		}

		const conveyorEgg = this.findConveyorEgg(playerEntity, eggInstanceId);
		if (!conveyorEgg) {
			this.logger.Warn(`Egg ${eggInstanceId} not found on conveyor for player ${userId}.`);
			return false;
		}

		// 检查蛋是否已经错过
		const currentTime = Workspace.GetServerTimeNow();
		const speedHistory = playerEntity.getPlayerState()?.conveyor.speedModeHistory ?? [];
		if (isEggMissed(conveyorEgg.moveStartTime, currentTime, speedHistory)) {
			this.logger.Warn(`Egg ${eggInstanceId} has already been missed for player ${userId}.`);
			return false;
		}

		store.pickupConveyorEgg(userId, conveyorEgg.instanceId);
		return true;
	}
}
