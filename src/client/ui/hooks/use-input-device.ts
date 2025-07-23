import { useEventListener } from "@rbxts/pretty-react-hooks";
import { useState } from "@rbxts/react";
import { UserInputService } from "@rbxts/services";

export type InputDevice = "gamepad" | "keyboard" | "touch";

function getInputType(inputType = UserInputService.GetLastInputType()): InputDevice | undefined {
	if (
		inputType === Enum.UserInputType.Keyboard ||
		inputType === Enum.UserInputType.MouseMovement
	) {
		return "keyboard";
	}

	if (inputType === Enum.UserInputType.Gamepad1) {
		return "gamepad";
	}

	if (inputType === Enum.UserInputType.Touch) {
		return "touch";
	}

	return undefined;
}

/**
 * Returns the current input device being used by the player.
 *
 * @returns An InputDevice string.
 */
export function useInputDevice(): InputDevice {
	const [device, setDevice] = useState<InputDevice>(() => getInputType() ?? "keyboard");

	useEventListener(UserInputService.LastInputTypeChanged, inputType => {
		const playerDevice = getInputType(inputType);

		if (playerDevice !== undefined) {
			setDevice(playerDevice);
		}
	});

	return device;
}
