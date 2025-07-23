import { hoarcekat } from "@rbxts/pretty-react-hooks";
import React from "@rbxts/react";

import { PrimaryButton } from "../components/primary-button";
import { Frame } from "../components/primitive";

export = hoarcekat(() => {
	// 这里可以使用hooks来测试
	return (
		<Frame
			Native={{
				Size: new UDim2(0, 600, 0, 600),
			}}
		>
			<PrimaryButton
				Native={{
					Size: new UDim2(0, 200, 0, 80),
				}}
			/>
		</Frame>
	);
});
