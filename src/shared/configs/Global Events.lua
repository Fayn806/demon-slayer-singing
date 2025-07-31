-- Saved by UniversalSynSaveInstance (Join to Copy Games) https://discord.gg/wx4ThpAsmw

--Decompiled by Medal, I take no credit I only Made The dumper and I I.. I iron man
local v1 = {
	["Durations"] = {
		60,
		75,
		90,
		105,
		120
	}
}
local v2 = {
	["GoldRush"] = {
		["Weight"] = 50
	},
	["FireSale"] = {
		["Weight"] = 50
	},
	["LightningStorm"] = {
		["Weight"] = 50
	},
	["SolarFlare"] = {
		["Weight"] = 50
	}
}
v1.Weights = v2
v1.GoldRush = {
	["name"] = "Gold Rush",
	["desc"] = "Earn 3x money and 2x gold luck!"
}
v1.FireSale = {
	["name"] = "Fire Sale",
	["desc"] = "Every egg is 50% off!"
}
v1.LightningStorm = {
	["name"] = "Electric Storm",
	["desc"] = "Watch out for lightning strikes!"
}
v1.SolarFlare = {
	["name"] = "SOLAR FLARE",
	["desc"] = "Watch out! Don\'t get burnt!",
	["delay"] = 15
}
v1.IceyStorm = {
	["name"] = "ICEY STORM",
	["desc"] = "Watch out! Chance that your brainrot will get frozen!"
}
v1.Glitch = {
	["name"] = "GLITCH EVENT",
	["desc"] = "Watch out for glitch spots appearing around the map!"
}
return v1
