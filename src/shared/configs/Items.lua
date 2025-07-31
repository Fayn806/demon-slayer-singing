-- Saved by UniversalSynSaveInstance (Join to Copy Games) https://discord.gg/wx4ThpAsmw

--Decompiled by Medal, I take no credit I only Made The dumper and I I.. I iron man
local v1 = game:GetService("ReplicatedStorage").Assets
local v_u_2 = v1.Placeables
local v_u_3 = v1.Particles
local v_u_4 = v1.Parts
local v_u_5 = v1.Interface.TypeImages
local v_u_6 = {
	["Golden"] = "rbxassetid://82358997543972",
	["Diamond"] = "rbxassetid://78349926635277",
	["Ice"] = "rbxassetid://123992742545013"
}
local function v_u_39(p7, p8)
	-- upvalues: (copy) v_u_6, (copy) v_u_3, (copy) v_u_4
	local v9 = p7.Name
	if table.find(p8, "Ice") then
		local v10 = next
		local v11, v12 = p7:GetChildren()
		for _, v13 in v10, v11, v12 do
			if v13:IsA("MeshPart") then
				v13.TextureID = v_u_6.Ice
			end
		end
	elseif table.find(p8, "Diamond") then
		local v14 = next
		local v15, v16 = p7:GetChildren()
		for _, v17 in v14, v15, v16 do
			if v17:IsA("MeshPart") then
				v17.TextureID = v_u_6.Diamond
			end
		end
	elseif table.find(p8, "Golden") then
		local v18 = next
		local v19, v20 = p7:GetChildren()
		for _, v21 in v18, v19, v20 do
			if v21:IsA("MeshPart") then
				v21.TextureID = v_u_6.Golden
			end
		end
	end
	for _, v22 in next, p8 do
		if v_u_3:FindFirstChild(v22 .. "_Folder") then
			local v23 = next
			local v24, v25 = p7:GetChildren()
			local v26 = nil
			for _, v27 in v23, v24, v25 do
				if v27:GetAttribute("Particles") or v27:GetAttribute("Particle") then
					v26 = v27
					break
				end
			end
			if v26 then
				local v28 = v_u_3[v22 .. "_Folder"]:FindFirstChild(v9) or v_u_3[v22 .. "_Folder"].AllItems
				if v28 then
					local v29 = next
					local v30, v31 = v28:GetChildren()
					for _, v32 in v29, v30, v31 do
						v32:Clone().Parent = v26
					end
				end
				local v33 = next
				local v34, v35 = v26:GetChildren()
				for _, v36 in v33, v34, v35 do
					if v36:IsA("Beam") then
						v36.Attachment0 = v26:FindFirstChild("AT0")
						v36.Attachment1 = v26:FindFirstChild("AT1")
					end
				end
			end
		elseif v_u_4:FindFirstChild(v22 .. "_Folder") then
			local v37 = v_u_4[v22 .. "_Folder"]:FindFirstChild(v9) or v_u_4[v22 .. "_Folder"]:FindFirstChild(v22)
			if v37 then
				local v38 = v37:Clone()
				v38:AddTag("BlacklistedPart")
				v38.Parent = p7
				if v38:IsA("Part") then
					v38.Size = p7.HITPART.Size
				end
				v38:PivotTo(p7:GetPivot())
			end
		end
		if v22 == "Glitch" then
			p7:AddTag(v22)
		end
	end
end
local v57 = {
	["UpdateModel"] = v_u_39,
	["GetImage"] = function(p40, p41, p42, p43, p44)
		-- upvalues: (copy) v_u_5
		if p40 and p41 then
			if p43 then
				local v45 = next
				local v46, v47 = p40:GetChildren()
				for _, v48 in v45, v46, v47 do
					if v48:IsA("ImageLabel") then
						v48:Destroy()
					end
				end
			end
			p40.Image = p41.icons.Normal
			if table.find(p42, "Diamond") then
				p40.Image = p41.icons.Diamond
			elseif table.find(p42, "Golden") then
				p40.Image = p41.icons.Golden
			end
			if p42 then
				for _, v49 in next, p42 do
					if v49 ~= "Golden" and v49 ~= "Diamond" then
						local v50 = v_u_5:FindFirstChild(v49)
						if v50 then
							local v51 = v50:Clone()
							local v52
							if p44 then
								v52 = p40.Parent or p40
							else
								v52 = p40
							end
							v51.Parent = v52
						end
					end
				end
			end
		else
			return
		end
	end,
	["GetModel"] = function(p53, p54)
		-- upvalues: (copy) v_u_2, (copy) v_u_39
		local v55 = v_u_2:FindFirstChild(p53)
		if v55 then
			local v56 = v55:Clone()
			v_u_39(v56, p54)
			return v56
		end
	end
}
local v58 = {
	["money_base"] = 1,
	["size"] = "Default",
	["name"] = "Tung Tung",
	["icons"] = {
		["Normal"] = "rbxassetid://74189907903501",
		["Golden"] = "rbxassetid://91045928508596",
		["Diamond"] = "rbxassetid://116877651073470"
	},
	["ft"] = 1.5,
	["percent"] = 1,
	["model"] = v_u_2.Item1,
	["order"] = 1,
	["belongsTo"] = "Island1"
}
v57.Item1 = v58
local v59 = {
	["money_base"] = 3,
	["size"] = "Default",
	["name"] = "Capuchino",
	["icons"] = {
		["Normal"] = "rbxassetid://88391155722486",
		["Golden"] = "rbxassetid://78173969986014",
		["Diamond"] = "rbxassetid://114578803331192"
	},
	["ft"] = 1,
	["percent"] = 1,
	["model"] = v_u_2.Item2,
	["order"] = 2,
	["belongsTo"] = "Island1"
}
v57.Item2 = v59
local v60 = {
	["money_base"] = 5,
	["size"] = "Default",
	["name"] = "Garam",
	["icons"] = {
		["Normal"] = "rbxassetid://108310922539712",
		["Golden"] = "rbxassetid://93666685661609",
		["Diamond"] = "rbxassetid://140625269767871"
	},
	["ft"] = 2,
	["percent"] = 2,
	["model"] = v_u_2.Item3,
	["order"] = 3,
	["belongsTo"] = "Island1"
}
v57.Item3 = v60
local v61 = {
	["money_base"] = 10,
	["size"] = "Default",
	["name"] = "Ramar",
	["icons"] = {
		["Normal"] = "rbxassetid://140595255276419",
		["Golden"] = "rbxassetid://94535742002505",
		["Diamond"] = "rbxassetid://94461362469199"
	},
	["ft"] = 2,
	["percent"] = 3,
	["model"] = v_u_2.Item4,
	["order"] = 4,
	["belongsTo"] = "Island1"
}
v57.Item4 = v61
local v62 = {
	["money_base"] = 15,
	["size"] = "Default",
	["name"] = "Boneca",
	["icons"] = {
		["Normal"] = "rbxassetid://126696482542607",
		["Golden"] = "rbxassetid://96512961087744",
		["Diamond"] = "rbxassetid://88589314636038"
	},
	["ft"] = 4,
	["percent"] = 3,
	["model"] = v_u_2.Item5,
	["order"] = 5,
	["belongsTo"] = "Island1"
}
v57.Item5 = v62
local v63 = {
	["money_base"] = 20,
	["size"] = "Default",
	["name"] = "Chimpanzini",
	["icons"] = {
		["Normal"] = "rbxassetid://95089604883043",
		["Golden"] = "rbxassetid://82630262115180",
		["Diamond"] = "rbxassetid://104323138680887"
	},
	["ft"] = 6,
	["percent"] = 3,
	["model"] = v_u_2.Item6,
	["order"] = 6,
	["belongsTo"] = "Island1"
}
v57.Item6 = v63
local v64 = {
	["money_base"] = 30,
	["size"] = "BigGuys",
	["name"] = "Udindindindin",
	["icons"] = {
		["Normal"] = "rbxassetid://132348015829134",
		["Golden"] = "rbxassetid://124332359034079",
		["Diamond"] = "rbxassetid://106739798260664"
	},
	["ft"] = 9,
	["percent"] = 3,
	["model"] = v_u_2.Item7,
	["order"] = 7,
	["belongsTo"] = "Island1"
}
v57.Item7 = v64
local v65 = {
	["money_base"] = 40,
	["size"] = "BigGuys",
	["name"] = "Trippi Troppi",
	["icons"] = {
		["Normal"] = "rbxassetid://76462440784259",
		["Golden"] = "rbxassetid://104202587128356",
		["Diamond"] = "rbxassetid://78611603925242"
	},
	["ft"] = 9,
	["percent"] = 3,
	["model"] = v_u_2.Item8,
	["order"] = 8,
	["belongsTo"] = "Island1"
}
v57.Item8 = v65
local v66 = {
	["money_base"] = 50,
	["size"] = "BigGuys",
	["name"] = "Tralalero",
	["icons"] = {
		["Normal"] = "rbxassetid://129928311534194",
		["Golden"] = "rbxassetid://72019622578776",
		["Diamond"] = "rbxassetid://96533019073610"
	},
	["ft"] = 8,
	["percent"] = 3,
	["model"] = v_u_2.Item9,
	["order"] = 9,
	["belongsTo"] = "Island1"
}
v57.Item9 = v66
local v67 = {
	["money_base"] = 65,
	["size"] = "BigGuys",
	["name"] = "Lirili Larila",
	["icons"] = {
		["Normal"] = "rbxassetid://125710667357253",
		["Golden"] = "rbxassetid://75591347856708",
		["Diamond"] = "rbxassetid://77626219904718"
	},
	["ft"] = 9,
	["percent"] = 3,
	["model"] = v_u_2.Item10,
	["order"] = 10,
	["belongsTo"] = "Island1"
}
v57.Item10 = v67
local v68 = {
	["money_base"] = 90,
	["size"] = "BigGuys",
	["name"] = "Brr Patapim",
	["icons"] = {
		["Normal"] = "rbxassetid://116410214171138",
		["Golden"] = "rbxassetid://84112874389061",
		["Diamond"] = "rbxassetid://114167849075913"
	},
	["ft"] = 13,
	["percent"] = 3,
	["model"] = v_u_2.Item11,
	["order"] = 11,
	["belongsTo"] = "Island1"
}
v57.Item11 = v68
local v69 = {
	["money_base"] = 125,
	["size"] = "BigGuys",
	["name"] = "Bombardino",
	["icons"] = {
		["Normal"] = "rbxassetid://126309452224056",
		["Golden"] = "rbxassetid://116870562306886",
		["Diamond"] = "rbxassetid://97866372475004"
	},
	["ft"] = 15,
	["percent"] = 3,
	["model"] = v_u_2.Item12,
	["order"] = 12,
	["belongsTo"] = "Island1"
}
v57.Item12 = v69
local v70 = {
	["money_base"] = 175,
	["size"] = "BigGuys",
	["name"] = "Bombombini",
	["icons"] = {
		["Normal"] = "rbxassetid://86948376320655",
		["Golden"] = "rbxassetid://100123355010253",
		["Diamond"] = "rbxassetid://98368752466537"
	},
	["ft"] = 16,
	["percent"] = 3,
	["model"] = v_u_2.Item13,
	["order"] = 13,
	["belongsTo"] = "Island1"
}
v57.Item13 = v70
return v57
