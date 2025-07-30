import type { Server } from "@rbxts/remo";
import { namespace, remote } from "@rbxts/remo";

export const plotRemote = namespace({
	buyConveyorEgg: remote<Server, [eggId: string]>().returns<boolean | undefined>(),
	buyMissedEgg: remote<Server, [eggId: string]>().returns<boolean>(),
	expand: remote<Server, [expansionId: string]>().returns<boolean | undefined>(),
	hatchEgg: remote<Server, [eggInstanceId: string]>().returns<boolean | undefined>(),
	hatchEggComplete: remote<Server, [eggInstanceId: string]>().returns<boolean | undefined>(),
	pickPet: remote<Server, [itemInstanceId: string]>().returns<boolean | undefined>(),
	placeItem: remote<Server, [itemInstanceId: string, location: CFrame]>().returns<
		boolean | undefined
	>(),
	switchHeldItemInstanceId: remote<Server, [itemInstanceId: string]>().returns<
		boolean | undefined
	>(),
});
