import { $NODE_ENV } from "rbxts-transform-env";

export enum GameId {
	Production = 8225495155,
	Development = 8234128914,
}

function IsGameId(value: number): value is GameId {
	return value in GameId;
}

export function getConfigValueForGame<const T>(gameIdToValueTable: Record<GameId, T>): T {
	if ($NODE_ENV === "development" && game.PlaceId === 0) {
		return gameIdToValueTable[GameId.Development];
	}

	assert(IsGameId(game.GameId), `Invalid game id for place: ${game.GameId}`);
	return gameIdToValueTable[game.GameId];
}
