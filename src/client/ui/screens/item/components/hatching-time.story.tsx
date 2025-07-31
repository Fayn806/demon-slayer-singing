import { hoarcekat } from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";
import { ReflexProvider } from "@rbxts/react-reflex";

import { store } from "client/store";
import { Layer } from "client/ui/components/primitive";
import { RemProvider } from "client/ui/providers/rem-provider";
import { EggMutation } from "shared/types";

import { HatchingTime } from "./hatching-time";

export = hoarcekat(() => {
	// 这里可以使用hooks来测试
	return (
		<RemProvider key="rem-provider">
			<ReflexProvider key="reflex-provider" producer={store}>
				<Layer>
					<uilistlayout
						FillDirection={Enum.FillDirection.Vertical}
						HorizontalAlignment={Enum.HorizontalAlignment.Center}
						SortOrder={Enum.SortOrder.LayoutOrder}
						VerticalAlignment={Enum.VerticalAlignment.Center}
					/>
					<HatchingTime eggMutations={[EggMutation.Normal]} leftTime={10} maxTime={10} />
				</Layer>
			</ReflexProvider>
		</RemProvider>
	);
});
