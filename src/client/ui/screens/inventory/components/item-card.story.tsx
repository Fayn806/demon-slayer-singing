import { hoarcekat } from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";

import { store } from "client/store";
import { RemProvider } from "client/ui/providers/rem-provider";

import { ItemCard } from "./item-card";

export = hoarcekat(() => {
	// 这里可以使用hooks来测试
	return (
		<RemProvider key="rem-provider">
			<ReflexProvider key="reflex-provider" producer={store}>
				<ItemCard />
			</ReflexProvider>
		</RemProvider>
	);
});
