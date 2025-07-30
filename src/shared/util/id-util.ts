import { HttpService } from "@rbxts/services";

export function generateUniqueId(prefix?: string): string {
	return prefix === undefined
		? HttpService.GenerateGUID(false)
		: `${prefix}_${HttpService.GenerateGUID(false)}`;
}
