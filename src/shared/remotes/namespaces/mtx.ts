import type { Server } from "@rbxts/remo";
import { namespace, remote } from "@rbxts/remo";

import type { GamePass } from "types/enum/mtx";

export const mtxRemote = namespace({
	setGamePassActive: remote<Server, [gamePass: GamePass, active: boolean]>(),
});
