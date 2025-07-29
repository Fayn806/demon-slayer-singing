import React from "@rbxts/react";

import { Layer } from "./components/primitive";
import { Inventory } from "./screens/inventory/inventory";

export function App(): React.ReactNode {
	return (
		<Layer key="example-layer">
			<Inventory />
		</Layer>
	);
}
