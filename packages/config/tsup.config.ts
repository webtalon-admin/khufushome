import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"vite-plugin": "src/vite-plugin.ts",
		client: "src/client.ts",
	},
	format: ["esm"],
	dts: true,
	clean: true,
	external: ["vite"],
});
