import { RunService } from "@rbxts/services";
import Signal from "@rbxts/signal";

export const GAME_NAME = "Template for roblox-ts";

export const IS_EDIT = RunService.IsStudio() && !RunService.IsRunning();

export const FlameworkIgnited = new Signal();
