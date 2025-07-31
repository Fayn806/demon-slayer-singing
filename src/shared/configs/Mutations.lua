-- Saved by UniversalSynSaveInstance (Join to Copy Games) https://discord.gg/wx4ThpAsmw

--Decompiled by Medal, I take no credit I only Made The dumper and I I.. I iron man
local v2 = {
	["Weight"] = {
		{
			["Name"] = "Normal",
			["Weight"] = 930
		},
		{
			["Name"] = "Golden",
			["Weight"] = 50
		},
		{
			["Name"] = "Diamond",
			["Weight"] = 15
		}
	},
	["GetModel"] = function(p1)
		return table.find(p1, "Fire") and "Fire" or (table.find(p1, "Electric") and "Electric" or (table.find(p1, "Glitch") and "Glitch" or (table.find(p1, "Ice") and "Ice" or (table.find(p1, "Diamond") and "Diamond" or (table.find(p1, "Golden") and "Golden" or "Normal")))))
	end,
	["Normal"] = {
		["multi"] = 1,
		["cost"] = 1
	},
	["Golden"] = {
		["multi"] = 2,
		["cost"] = 3,
		["stack"] = false
	},
	["Diamond"] = {
		["multi"] = 3,
		["cost"] = 10,
		["stack"] = false
	},
	["Electric"] = {
		["multi"] = 5,
		["cost"] = 20,
		["stack"] = true
	},
	["Fire"] = {
		["multi"] = 10,
		["cost"] = 50,
		["stack"] = true
	},
	["Ice"] = {
		["multi"] = 10,
		["cost"] = 50,
		["stack"] = true
	},
	["Glitch"] = {
		["multi"] = 10,
		["cost"] = 50,
		["stack"] = true
	}
}
return v2
