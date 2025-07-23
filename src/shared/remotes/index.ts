import { createRemotes } from "@rbxts/remo";

import { storeRemote } from "./namespaces";
import { mtxRemote } from "./namespaces/mtx";

export const remotes = createRemotes({
	mtx: mtxRemote,
	store: storeRemote,
});
