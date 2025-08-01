interface ReplicatedStorage {
	"Assets": Folder & {
		Boomboxes: Folder;
		Characters: Folder;
		Eggs: Folder & {
			Egg1: Model;
			Egg2: Model;
			Egg3: Model;
			Egg4: Model;
			Egg5: Model;
			Egg6: Model;
			Egg7: Model;
			Egg8: Model;
		};
		Particles: Folder & {
			Collect: Part & {
				Attachment: Attachment;
			};
		};
	};
	"ExpandReserve": Folder & {
		"1": Folder;
		"2": Folder;
		"3": Folder;
		"4": Folder;
		"5": Folder;
		"6": Folder;
		"7": Folder;
		"8": Folder;
	};
	"rbxts_include": Folder & {
		Promise: ModuleScript;
		RuntimeLib: ModuleScript;
	};
	"TS": Folder & {
		assets: ModuleScript;
		constants: ModuleScript;
		functions: Folder & {
			"game-config": ModuleScript;
			"setup-logger": ModuleScript;
		};
		modules: Folder & {
			"3d-sound-system": ModuleScript;
		};
		network: ModuleScript;
		store: ModuleScript & {
			middleware: Folder & {
				profiler: ModuleScript;
			};
			persistent: ModuleScript & {
				"persistent-selectors": ModuleScript;
				"persistent-slice": ModuleScript & {
					"achievements": ModuleScript;
					"balance": ModuleScript;
					"default-data": ModuleScript;
					"mtx": ModuleScript;
					"settings": ModuleScript;
				};
			};
		};
		util: Folder & {
			"core-call": ModuleScript;
			"flamework-util": ModuleScript;
			"physics-util": ModuleScript;
			"player-util": ModuleScript;
		};
	};

	"TS-types": Folder & {
		enum: Folder & {
			badge: ModuleScript;
			mtx: ModuleScript;
			tag: ModuleScript;
		};
		interfaces: Folder;
		util: Folder;
	};
}

interface ServerScriptService {
	TS: Folder & {
		"mtx-service": ModuleScript;
		"network": ModuleScript;
		"player": Folder & {
			"character": Folder & {
				"character-service": ModuleScript;
			};
			"data": Folder & {
				"player-data-service": ModuleScript;
				"validate-data": ModuleScript;
			};
			"leaderstats-service": ModuleScript;
			"player-badge-service": ModuleScript;
			"player-entity": ModuleScript;
			"player-removal-service": ModuleScript;
			"player-service": ModuleScript;
			"with-player-entity": ModuleScript;
		};
		"runtime": Script;
		"store": ModuleScript & {
			middleware: Folder & {
				broadcaster: ModuleScript;
			};
		};
	};
}

interface Workspace {
	Baseplate: Part;
	Main: Folder & {
		Plots: Folder & {
			"1": Folder & {
				Boundary: Part;
				Expand: Folder;
				Respawn: Part;
			};
			"2": Folder & {
				Boundary: Part;
				Expand: Folder;
				Respawn: Part;
			};
			"3": Folder & {
				Boundary: Part;
				Expand: Folder;
				Respawn: Part;
			};
			"4": Folder & {
				Boundary: Part;
				Expand: Folder;
				Respawn: Part;
			};
			"5": Folder & {
				Boundary: Part;
				Expand: Folder;
				Respawn: Part;
			};
			"6": Folder & {
				Boundary: Part;
				Expand: Folder;
				Respawn: Part;
			};
			"7": Folder & {
				Boundary: Part;
				Expand: Folder;
				Respawn: Part;
			};
			"8": Folder & {
				Boundary: Part;
				Expand: Folder;
				Respawn: Part;
			};
		};
	};
}
