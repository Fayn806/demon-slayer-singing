import { Service } from "@flamework/core";
import type { Logger } from "@rbxts/log";

import type { PlayerEntity } from "server/services/player/player-entity";
import { store } from "server/store";

import type { OnPlayerIslandLoad } from "../island-service";

@Service({})
export class ExpandService implements OnPlayerIslandLoad {
	constructor(private readonly logger: Logger) {}

	public onPlayerIslandLoad(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		this.logger.Info(`Player ${userId} has loaded their island for expand service.`);

		// 可以在这里进行岛屿扩展状态的初始化检查
		this.validatePlayerExpansions(userId);
	}

	public onPlayerIslandUnload(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		this.logger.Info(`Player ${userId} has unloaded their island from expand service.`);
	}

	/**
	 * 执行地块扩展.
	 *
	 * @param playerEntity - 玩家实体.
	 * @param expansionId - 扩展区域ID.
	 * @param cost - 扩展成本（可选，用于验证）.
	 * @returns 是否成功扩展.
	 */
	public expandPlot(playerEntity: PlayerEntity, expansionId: string, cost?: number): boolean {
		const { userId } = playerEntity;
		const state = store.getState();
		const playerState = state.players[userId];

		if (!playerState) {
			this.logger.Warn(`Player ${userId} state not found when trying to expand plot.`);
			return false;
		}

		const currentIslandState = playerState.islands[playerState.plot.islandId];
		if (!currentIslandState) {
			this.logger.Warn(`Player ${userId} current island state not found.`);
			return false;
		}

		// 检查是否已经扩展过
		if (currentIslandState.expands[expansionId] === true) {
			this.logger.Warn(`Player ${userId} already expanded area ${expansionId}.`);
			return false;
		}

		// 这里可以添加成本检查逻辑
		if (cost !== undefined) {
			// TODO: 实现资源检查逻辑
		}

		// 执行扩展
		store.setPlotExpanded(userId, expansionId);

		this.logger.Info(`Player ${userId} successfully expanded area ${expansionId}.`);
		return true;
	}

	/**
	 * 检查指定扩展区域是否已解锁.
	 *
	 * @param playerEntity - 玩家实体.
	 * @param expansionId - 扩展区域ID.
	 * @returns 是否已解锁.
	 */
	public isExpansionUnlocked(playerEntity: PlayerEntity, expansionId: string): boolean {
		const { userId } = playerEntity;
		const state = store.getState();
		const playerState = state.players[userId];

		if (!playerState) {
			return false;
		}

		const currentIslandState = playerState.islands[playerState.plot.islandId];
		if (!currentIslandState) {
			return false;
		}

		return currentIslandState.expands[expansionId] === true;
	}

	/**
	 * 获取玩家当前岛屿的所有扩展状态.
	 *
	 * @param playerEntity - 玩家实体.
	 * @returns 扩展状态记录.
	 */
	public getPlayerExpansions(playerEntity: PlayerEntity): Record<string, boolean> {
		const { userId } = playerEntity;
		const state = store.getState();
		const playerState = state.players[userId];

		if (!playerState) {
			return {};
		}

		const currentIslandState = playerState.islands[playerState.plot.islandId];
		if (!currentIslandState) {
			return {};
		}

		return currentIslandState.expands;
	}

	/**
	 * 批量设置扩展状态（用于管理员或初始化）.
	 *
	 * @param playerEntity - 玩家实体.
	 * @param expansions - 扩展状态映射.
	 */
	public setPlayerExpansions(
		playerEntity: PlayerEntity,
		expansions: Record<string, boolean>,
	): void {
		const { userId } = playerEntity;
		for (const [expansionId, isExpanded] of pairs(expansions)) {
			if (isExpanded) {
				store.setPlotExpanded(userId, expansionId);
			}
		}

		const expansionEntries = [];
		for (const [key, value] of pairs(expansions)) {
			expansionEntries.push([key, value]);
		}

		const expansionCount = expansionEntries.size();

		this.logger.Info(`Set expansions for player ${userId}: ${expansionCount} areas.`);
	}

	/**
	 * 重置玩家在当前岛屿的所有扩展（慎用）.
	 *
	 * @param playerEntity - 玩家实体.
	 */
	public resetPlayerExpansions(playerEntity: PlayerEntity): void {
		const { userId } = playerEntity;
		const state = store.getState();
		const playerState = state.players[userId];

		if (!playerState) {
			this.logger.Warn(`Player ${userId} state not found when trying to reset expansions.`);
			return;
		}

		// 由于slice中没有重置扩展的action，这里需要通过设置空的扩展状态来实现
		// 或者可以考虑添加一个resetExpansions action到slice中
		this.logger.Warn(
			`Reset expansions for player ${userId} - this operation may need additional implementation.`,
		);
	}

	/**
	 * 获取可用的扩展区域列表（基于当前扩展状态）.
	 *
	 * @param playerEntity - 玩家实体.
	 * @returns 可扩展的区域ID数组.
	 */
	public getAvailableExpansions(playerEntity: PlayerEntity): Array<string> {
		// 这里应该根据游戏规则返回可扩展的区域
		// 例如：某些扩展可能需要前置扩展
		const currentExpansions = this.getPlayerExpansions(playerEntity);

		// 示例逻辑：假设有基础扩展区域
		const allPossibleExpansions = ["area_1", "area_2", "area_3", "area_4", "area_5"];
		const availableExpansions: Array<string> = [];

		for (const expansionId of allPossibleExpansions) {
			if (currentExpansions[expansionId] !== true) {
				// 这里可以添加前置条件检查
				availableExpansions.push(expansionId);
			}
		}

		return availableExpansions;
	}

	/**
	 * 验证玩家扩展状态的完整性.
	 *
	 * @param playerId - 玩家ID.
	 */
	private validatePlayerExpansions(playerId: string): void {
		const state = store.getState();
		const playerState = state.players[playerId];

		if (!playerState) {
			return;
		}

		const currentIslandState = playerState.islands[playerState.plot.islandId];
		if (!currentIslandState) {
			return;
		}

		const expansions = currentIslandState.expands;
		const expansionEntries = [];
		for (const [key, value] of pairs(expansions)) {
			expansionEntries.push([key, value]);
		}

		const expansionCount = expansionEntries.size();

		this.logger.Debug(
			`Player ${playerId} has ${expansionCount} expansions on island ${playerState.plot.islandId}.`,
		);

		// 这里可以添加扩展状态的验证逻辑
		// 例如检查扩展的依赖关系、合法性等
	}
}
