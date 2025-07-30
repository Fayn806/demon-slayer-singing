import type { Server } from "@rbxts/remo";
import { namespace, remote } from "@rbxts/remo";

export const plotRemote = namespace({
	buyConveyorEgg: remote<Server, [eggId: string]>().returns<boolean | undefined>(),
	buyMissedEgg: remote<Server, [eggId: string]>().returns<boolean>(),
	expand: remote<Server, [expansionId: string]>().returns<boolean | undefined>(),
	placeItem: remote<Server, [itemInstanceId: string, location: CFrame]>().returns<
		boolean | undefined
	>(),
	switchHeldItemInstanceId: remote<Server, [itemInstanceId: string]>().returns<
		boolean | undefined
	>(),
});
