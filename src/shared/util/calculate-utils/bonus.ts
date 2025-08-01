import { Workspace } from "@rbxts/services";
import { configs } from "shared/configs";
import { BonusType, BoosterType, PlacedBooster, PlacedEgg } from "shared/types";

export function calculateBonus(placedEgg: PlacedEgg, boosters: Array<PlacedBooster>): Map<BonusType, number> {
    const currentTime = Workspace.GetServerTimeNow();
	const bonusMap = new Map<BonusType, number>();
    const { bonuses, bonusUpdateTime } = placedEgg;

    for (const placedBooster of boosters) {
		const boosterConfig = configs.BoomboxesConfig[placedBooster.boosterId];
		if (!boosterConfig) {
			continue;
		}

		const { placedTime } = placedBooster;
		const bonusStartTime = math.max(bonusUpdateTime, placedTime);

		const second = math.floor(
			math.min(placedTime + (boosterConfig.duration ?? 0), currentTime) - bonusStartTime,
		);
		if (second <= 0) {
			continue;
		}

        // 查找已应用的加成值
        const appliedBonus = bonuses.find(bonus => bonus.fromInstanceId === placedBooster.instanceId);
        const currentAppliedValue = appliedBonus?.value ?? 0;

        // 计算新的增益值
        const newBonusValue = (boosterConfig.perSecond ?? 0) * second;
        
        // 总加成值不超过最大加成
        const totalBonusValue = math.min(
            currentAppliedValue + newBonusValue,
            boosterConfig.maxBoost ?? 0
        );
        
        // 实际需要添加的增益值
        const bonusToAdd = totalBonusValue - currentAppliedValue;

        if (boosterConfig.type === "Size") {
            bonusMap.set(BonusType.Size, (bonusMap.get(BonusType.Size) ?? 0) + bonusToAdd);
        } else if (boosterConfig.type === "Luck") {
            bonusMap.set(BonusType.Luck, (bonusMap.get(BonusType.Luck) ?? 0) + bonusToAdd);
        } else if (boosterConfig.type === "Size Luck") {
            // 对于Size Luck类型的增益器，分别应用加成
            bonusMap.set(BonusType["Size Luck"], (bonusMap.get(BonusType["Size Luck"]) ?? 0) + bonusToAdd);
        } else if (boosterConfig.type === "Luck Size") {
            // 对于Luck Size类型的增益器，分别应用加成
            bonusMap.set(BonusType["Luck Size"], (bonusMap.get(BonusType["Luck Size"]) ?? 0) + bonusToAdd);
        }
    }

    // 合并已有的加成
    for (const bonus of bonuses) {
        const existingValue = bonusMap.get(bonus.type) ?? 0;
        bonusMap.set(bonus.type, existingValue + bonus.value);
    }

    return bonusMap;
}