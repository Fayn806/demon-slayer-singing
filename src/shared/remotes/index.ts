import { createRemotes } from "@rbxts/remo";

import { mtxRemote, plotRemote, storeRemote } from "./namespaces";

export const remotes = createRemotes({
	mtx: mtxRemote,
	plot: plotRemote,
	store: storeRemote,
});
