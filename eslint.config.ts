import style from "@isentinel/eslint-config";

import prettier from "eslint-plugin-prettier";

export default style(
	{
		perfectionist: {
			customClassGroups: [
				"onInit",
				"onStart",
				"onPlayerJoin",
				"onPlayerLeave",
				"onRender",
				"onPhysics",
				"onTick",
			],
		},
		plugins: {
			prettier,
		},
		pnpm: true,
		react: true,
		rules: {
			"antfu/consistent-list-newline": "off",
			"jsdoc/informative-docs": "off",
			"perfectionist/sort-objects": [
				"error",
				{
					customGroups: {
						id: "^id$",
						name: "^name$",
						callbacks: ["\b(on[A-Z][a-zA-Z]*)\b"],
						reactProps: ["^children$", "^ref$"],
						reflex: ["^loadPlayerData$", "^closePlayerData$"],
					},
					groups: ["id", "name", "reflex", "unknown", "reactProps"],
					order: "asc",
					partitionByComment: "^Part:\\*\\*(.*)$",
					type: "natural",
				},
			],
			"unicorn/no-keyword-prefix": "off",
		},
		type: "game",
		typescript: {
			parserOptions: {
				project: "tsconfig.build.json",
			},
			tsconfigPath: "tsconfig.build.json",
		},
	},
	{
		files: ["src/client/ui/hooks/**/*", "src/client/ui/components/**/*"],
		rules: {
			"max-lines-per-function": "off",
		},
	},
	{
		ignores: [
			// Markdown files
			"**/*.md",
			"docs/**/*.md",
			"prompts/**/*.md",

			// Yaml files
			"**/*.yaml",
			"**/*.yml",

			// Assets
			"assets/**/*.*",
			"asset/**/*.*",

			// Build outputs
			"dist/",
			"build/",
			"out/",

			// Node modules
			"node_modules/",
		],
	},
);
