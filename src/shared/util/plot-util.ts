/** Plot 相关实用工具函数. */

import { waitForChildren } from "shared/util/instance-util";

/**
 * 等待 Plot 结构完全加载完成.
 *
 * @param plotFolder - Plot 文件夹实例.
 * @param timeout - 超时时间（秒），默认 30 秒.
 * @returns Promise，成功时返回 true.
 */
export async function waitForPlotStructure(plotFolder: Folder, timeout = 30): Promise<boolean> {
	try {
		// 定义必需的子项结构
		const requiredChildren = [
			"BeamPart",
			"Conveyor",
			"Eggs",
			"Expand",
			"Island1",
			"Items",
			"Locked",
			"LockedPortal",
			"RNG",
			"Sign",
			"Spawn",
		];

		// 等待所有必需的顶级子项
		await waitForChildren(plotFolder, requiredChildren, timeout);

		// 等待 Conveyor 子结构
		const conveyorFolder = plotFolder.FindFirstChild("Conveyor") as Model | undefined;
		if (conveyorFolder) {
			const conveyorChildren = ["Belt", "Finish", "MissedEggs", "Spawn"];
			await waitForChildren(conveyorFolder, conveyorChildren, timeout);
		}

		return true;
	} catch (err) {
		// eslint-disable-next-line ts/only-throw-error -- Roblox uses string errors
		throw `Failed to load plot structure: ${err}`;
	}
}

/**
 * 等待 Plot 核心结构加载完成（仅必需的部分）.
 *
 * @param plotFolder - Plot 文件夹实例.
 * @param timeout - 超时时间（秒），默认 15 秒.
 * @returns Promise，成功时返回 true.
 */
export async function waitForPlotCoreStructure(plotFolder: Folder, timeout = 15): Promise<boolean> {
	try {
		// 只等待核心必需的子项
		const coreChildren = ["Conveyor", "Eggs", "Island1"];

		// 等待核心子项
		await waitForChildren(plotFolder, coreChildren, timeout);

		// 确保 Eggs 文件夹存在（这是最重要的）
		const eggsFolder = plotFolder.FindFirstChild("Eggs");
		if (!eggsFolder) {
			// 如果不存在则创建
			const newEggsFolder = new Instance("Folder");
			newEggsFolder.Name = "Eggs";
			newEggsFolder.Parent = plotFolder;
		}

		return true;
	} catch (err) {
		// eslint-disable-next-line ts/only-throw-error -- Roblox uses string errors
		throw `Failed to load plot core structure: ${err}`;
	}
}

/**
 * 安全地获取或创建 Plot 的必需文件夹.
 *
 * @param plotFolder - Plot 文件夹实例.
 * @param folderName - 文件夹名称.
 * @returns 文件夹实例.
 */
export function getOrCreatePlotFolder(plotFolder: Folder, folderName: string): Folder {
	let folder = plotFolder.FindFirstChild(folderName) as Folder | undefined;

	if (!folder) {
		folder = new Instance("Folder");
		folder.Name = folderName;
		folder.Parent = plotFolder;
	}

	return folder;
}

/**
 * 检查 Plot 结构是否完整.
 *
 * @param plotFolder - Plot 文件夹实例.
 * @returns 结构检查结果.
 */
export function validatePlotStructure(plotFolder: Folder): {
	issues: Array<string>;
	isValid: boolean;
	missingChildren: Array<string>;
} {
	const result = {
		issues: [] as Array<string>,
		isValid: true,
		missingChildren: [] as Array<string>,
	};

	const requiredChildren = [
		{ name: "BeamPart", type: "Part" },
		{ name: "Conveyor", type: "Model" },
		{ name: "Eggs", type: "Folder" },
		{ name: "Expand", type: "Folder" },
		{ name: "Island1", type: "Model" },
		{ name: "Items", type: "Folder" },
		{ name: "Locked", type: "Folder" },
		{ name: "LockedPortal", type: "Folder" },
		{ name: "RNG", type: "Folder" },
		{ name: "Sign", type: "Model" },
		{ name: "Spawn", type: "SpawnLocation" },
	];

	for (const required of requiredChildren) {
		const child = plotFolder.FindFirstChild(required.name);

		if (!child) {
			result.missingChildren.push(required.name);
			result.isValid = false;
		} else if (!child.IsA(required.type as keyof Instances)) {
			result.issues.push(
				`${required.name} should be ${required.type}, but is ${(child as Instance).ClassName}`,
			);
			result.isValid = false;
		}
	}

	// 检查 Conveyor 子结构
	const conveyor = plotFolder.FindFirstChild("Conveyor") as Model | undefined;
	if (conveyor) {
		const conveyorRequired = [
			{ name: "Belt", type: "Model" },
			{ name: "Finish", type: "Part" },
			{ name: "MissedEggs", type: "Part" },
			{ name: "Spawn", type: "Part" },
		];

		for (const required of conveyorRequired) {
			const child = conveyor.FindFirstChild(required.name);

			if (!child) {
				result.missingChildren.push(`Conveyor.${required.name}`);
				result.isValid = false;
			}
		}
	}

	return result;
}
