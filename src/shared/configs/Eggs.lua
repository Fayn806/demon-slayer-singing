-- Saved by UniversalSynSaveInstance (Join to Copy Games) https://discord.gg/wx4ThpAsmw

--Decompiled by Medal, I take no credit I only Made The dumper and I I.. I iron man
local v1 = game:GetService("ReplicatedStorage").Assets
local v2 = v1.Eggs
local _ = v1.Particles
local v3 = {}
local v4 = {
	["name"] = "Basic Egg",
	["icon"] = "rbxassetid://106408716253369",
	["luck"] = "1x",
	["roll"] = {
		["Item1"] = 33,
		["Item2"] = 33,
		["Item3"] = 33,
		["Item4"] = 0.1,
		["Item5"] = 0.01,
		["Item6"] = 0.001
	},
	["model"] = v2.Egg1,
	["hatchTime"] = 5,
	["cost"] = 100,
	["order"] = 1
}
v3.Egg1 = v4
local v5 = {
	["name"] = "Rare Egg",
	["icon"] = "rbxassetid://112951520879497",
	["luck"] = "2x",
	["roll"] = {
		["Item2"] = 40,
		["Item3"] = 30,
		["Item4"] = 20,
		["Item5"] = 10,
		["Item6"] = 0.1,
		["Item7"] = 0.01
	},
	["model"] = v2.Egg2,
	["hatchTime"] = 10,
	["cost"] = 500,
	["order"] = 2
}
v3.Egg2 = v5
local v6 = {
	["name"] = "Epic Egg",
	["icon"] = "rbxassetid://88932768248747",
	["luck"] = "5x",
	["roll"] = {
		["Item3"] = 40,
		["Item4"] = 35,
		["Item5"] = 25,
		["Item6"] = 10,
		["Item7"] = 5,
		["Item8"] = 0.1,
		["Item9"] = 0.01
	},
	["model"] = v2.Egg3,
	["hatchTime"] = 30,
	["cost"] = 2500,
	["order"] = 3
}
v3.Egg3 = v6
local v7 = {
	["name"] = "Shard Egg",
	["icon"] = "rbxassetid://126420784676693",
	["luck"] = "20x",
	["roll"] = {
		["Item4"] = 70,
		["Item5"] = 50,
		["Item6"] = 30,
		["Item7"] = 20,
		["Item8"] = 15,
		["Item9"] = 10,
		["Item10"] = 0.1,
		["Item11"] = 0.01
	},
	["model"] = v2.Egg4,
	["hatchTime"] = 60,
	["cost"] = 15000,
	["order"] = 4
}
v3.Egg4 = v7
local v8 = {
	["name"] = "Flame Egg",
	["icon"] = "rbxassetid://107297955470731",
	["luck"] = "100x",
	["roll"] = {
		["Item6"] = 33,
		["Item7"] = 25,
		["Item8"] = 19,
		["Item9"] = 13,
		["Item10"] = 6,
		["Item11"] = 3,
		["Item12"] = 0.1,
		["Item13"] = 0.01
	},
	["model"] = v2.Egg5,
	["hatchTime"] = 300,
	["cost"] = 100000,
	["order"] = 5
}
v3.Egg5 = v8
local v9 = {
	["name"] = "Pixel Egg",
	["icon"] = "rbxassetid://127945475999792",
	["luck"] = "1,000x",
	["roll"] = {
		["Item9"] = 60,
		["Item10"] = 35,
		["Item11"] = 4,
		["Item12"] = 1,
		["Item13"] = 0.2
	},
	["model"] = v2.Egg6,
	["hatchTime"] = 600,
	["cost"] = 1000000,
	["order"] = 6
}
v3.Egg6 = v9
local v10 = {
	["name"] = "Angel Egg",
	["icon"] = "rbxassetid://126404116418435",
	["luck"] = "5,000x",
	["roll"] = {
		["Item10"] = 80,
		["Item11"] = 15,
		["Item12"] = 4,
		["Item13"] = 1
	},
	["model"] = v2.Egg7,
	["hatchTime"] = 1800,
	["cost"] = 10000000,
	["order"] = 7
}
v3.Egg7 = v10
local v11 = {
	["name"] = "sPiKe EgG",
	["icon"] = "rbxassetid://111938315441377",
	["luck"] = "25,000x",
	["roll"] = {
		["Item11"] = 80,
		["Item12"] = 15,
		["Item13"] = 5
	},
	["model"] = v2.Egg8,
	["hatchTime"] = 3600,
	["cost"] = 100000000,
	["order"] = 8
}
v3.Egg8 = v11
return v3
