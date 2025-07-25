import { Controller } from "@flamework/core";
import type { Logger } from "@rbxts/log";

@Controller({})
export class PlotController {
	constructor(private readonly logger: Logger) {}
}
