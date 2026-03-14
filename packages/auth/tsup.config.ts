import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"hooks/index": "src/hooks/index.ts",
	},
	format: ["esm"],
	dts: true,
	clean: true,
	external: ["react", "react-dom", "@supabase/supabase-js", "@supabase/ssr"],
});
