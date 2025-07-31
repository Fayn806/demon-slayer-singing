-- Saved by UniversalSynSaveInstance (Join to Copy Games) https://discord.gg/wx4ThpAsmw

--Decompiled by Medal, I take no credit I only Made The dumper and I I.. I iron man
local v_u_1 = game:GetService("RunService")
local v_u_2 = {
	["Composing"] = {
		["GLOBAL_EVENTS"] = false,
		["COLLECT"] = false,
		["BPM"] = 150,
		["Beats"] = 24,
		["BeatDuration"] = 0.4,
		["GridSize"] = 4,
		["X"] = 24,
		["Y"] = 20
	}
}
local v3 = {
	["GLOBAL_EVENTS"] = true,
	["COLLECT"] = true,
	["Conveyor"] = {
		{
			["Name"] = "Egg1",
			["Weight"] = 500
		},
		{
			["Name"] = "Egg2",
			["Weight"] = 250
		},
		{
			["Name"] = "Egg3",
			["Weight"] = 125
		},
		{
			["Name"] = "Egg4",
			["Weight"] = 60
		},
		{
			["Name"] = "Egg5",
			["Weight"] = 40
		},
		{
			["Name"] = "Egg6",
			["Weight"] = 20
		},
		{
			["Name"] = "Egg7",
			["Weight"] = 4.5
		},
		{
			["Name"] = "Egg8",
			["Weight"] = 0.5
		}
	}
}
v_u_2.Island1 = v3
local v16 = {
	["Composing"] = {
		["name"] = "Compose Music",
		["icon"] = "rbxassetid://71982185578131",
		["desc"] = "Make your own music",
		["type_"] = "Compose",
		["order"] = 1,
		["HIDECOUNT"] = true,
		["SetUp"] = function(p4)
			-- upvalues: (copy) v_u_1, (copy) v_u_2
			if v_u_1:IsServer() then
				local v5 = p4:FindFirstChild("StartGrid")
				local v6 = p4:FindFirstChild("Sheet")
				if v5 and v6 then
					for v7 = 0, v_u_2.Composing.X - 1 do
						local v8 = v7 + 1
						local v9 = v6:FindFirstChild((tostring(v8)))
						if not v9 then
							v9 = Instance.new("Model")
							v9.Parent = v6
							local v10 = v7 + 1
							v9.Name = tostring(v10)
						end
						for v11 = 0, v_u_2.Composing.Y - 1 do
							local v12 = v5:Clone()
							v12.Anchored = true
							v12.CanCollide = true
							local v13 = v11 + 1
							v12.Name = tostring(v13)
							local v14 = v11 + 1
							if v14 <= 4 and v14 >= 1 then
								v12.Color = Color3.fromRGB(0, 34, 255)
								v12:SetAttribute("Octave", -2)
							elseif v14 <= 8 and v14 >= 5 then
								v12.Color = Color3.fromRGB(0, 98, 255)
								v12:SetAttribute("Octave", -1)
							elseif v14 <= 20 and v14 >= 17 then
								v12.Color = Color3.fromRGB(0, 34, 255)
								v12:SetAttribute("Octave", 2)
							elseif v14 <= 16 and v14 >= 13 then
								v12.Color = Color3.fromRGB(0, 98, 255)
								v12:SetAttribute("Octave", 1)
							else
								v12.Color = Color3.fromRGB(0, 142, 236)
								v12:SetAttribute("Octave", 0)
							end
							local v15 = CFrame.new(v11 * v_u_2.Composing.GridSize, 0, v7 * v_u_2.Composing.GridSize)
							v12.CFrame = v5.CFrame * v15
							v12.Parent = v9
						end
					end
					v5:Destroy()
				end
			else
				return
			end
		end,
		["SETTINGS"] = v_u_2.Composing
	},
	["Island1"] = {
		["name"] = "Default",
		["icon"] = "rbxassetid://134807444296434",
		["type_"] = "Conveyor",
		["order"] = 2,
		["toUnlock"] = 13,
		["SETTINGS"] = v_u_2.Island1
	}
}
return v16
