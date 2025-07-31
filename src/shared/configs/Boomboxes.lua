-- Saved by UniversalSynSaveInstance (Join to Copy Games) https://discord.gg/wx4ThpAsmw

--Decompiled by Medal, I take no credit I only Made The dumper and I I.. I iron man
local v1 = game:GetService("ReplicatedStorage").Assets.Boomboxes
local v2 = {
	["Boombox1"] = {
		["name"] = "Cardboard Boombox",
		["icon"] = "rbxassetid://128639648014185",
		["desc"] = "Increase <font color=\'#ffff00\'>SIZE LUCK</font> by placing this near your eggs!",
		["subdesc"] = "Up to <font color=\'#00ff00\'>3X LUCK</font>\nLasts for <font color=\'#00ffff\'>10 MINUTES</font>",
		["model"] = v1.Boombox1,
		["cost"] = 75000,
		["perSecond"] = 0.02,
		["radius"] = 9,
		["duration"] = 600,
		["maxBoost"] = 3,
		["type"] = "Size",
		["order"] = 1
	},
	["Boombox2"] = {
		["name"] = "Crystal Boombox",
		["icon"] = "rbxassetid://128677839845112",
		["desc"] = "Increase <font color=\'#00ff00\'>HATCH LUCK</font> by placing this near your eggs!",
		["subdesc"] = "Up to <font color=\'#00ff00\'>3X LUCK</font>\nLasts for <font color=\'#00ffff\'>10 MINUTES</font>",
		["model"] = v1.Boombox2,
		["cost"] = 300000,
		["perSecond"] = 0.02,
		["radius"] = 9,
		["duration"] = 600,
		["maxBoost"] = 3,
		["type"] = "Luck",
		["order"] = 2
	},
	["Boombox3"] = {
		["name"] = "Dark Matter Boombox",
		["icon"] = "rbxassetid://128562724652965",
		["desc"] = "Increase <font color=\'#ffff00\'>SIZE</font> and <font color=\'#00ff00\'>HATCH LUCK</font> by placing this near your eggs!",
		["subdesc"] = "Up to <font color=\'#00ff00\'>5X LUCK</font>\nLasts for <font color=\'#00ffff\'>30 MINUTES</font>",
		["model"] = v1.Boombox3,
		["cost"] = 1000000,
		["perSecond"] = 0.03,
		["radius"] = 11.5,
		["duration"] = 1800,
		["maxBoost"] = 5,
		["type"] = "Size Luck",
		["order"] = 3
	},
	["Boombox4"] = {
		["name"] = "Bubble Gum Boombox",
		["icon"] = "rbxassetid://90140760920534",
		["model"] = v1.Boombox4,
		["perSecond"] = 0.04,
		["radius"] = 12.5,
		["duration"] = 1800,
		["maxBoost"] = 7.5,
		["type"] = "Luck Size",
		["order"] = 4
	},
	["GoldenBoombox"] = {
		["name"] = "Golden Boombox",
		["icon"] = "rbxassetid://100094077852614",
		["model"] = v1.GoldenBoombox,
		["radius"] = 12.5,
		["type"] = "Golden",
		["order"] = 5,
		["INSTANT"] = true
	},
	["DiamondBoombox"] = {
		["name"] = "Diamond Boombox",
		["icon"] = "rbxassetid://71888236463005",
		["model"] = v1.DiamondBoombox,
		["radius"] = 12.5,
		["type"] = "Diamond",
		["order"] = 6,
		["INSTANT"] = true
	}
}
return v2
