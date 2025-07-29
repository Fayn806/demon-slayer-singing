import type { Server } from "@rbxts/remo";
import { namespace, remote } from "@rbxts/remo";

export const plotRemote = namespace({
	buyConveyorEgg: remote<Server, [eggId: string]>().returns<boolean | undefined>(),
	buyMissedEgg: remote<Server, [eggId: string]>().returns<boolean>(),
	expand: remote<Server, [expansionId: string]>().returns<boolean | undefined>(),
	switchHeldItem: remote<Server, [itemInstanceId: string]>().returns<boolean>(),
});
