import type { BroadcastAction } from "@rbxts/reflex";
import type { Client, Server } from "@rbxts/remo";
import { namespace, remote } from "@rbxts/remo";

import type { SerializedSharedState } from "shared/store";

export const storeRemote = namespace({
	dispatch: remote<Client, [actions: Array<BroadcastAction>]>(),
	hydrate: remote<Client, [state: SerializedSharedState]>(),
	start: remote<Server>(),
});
