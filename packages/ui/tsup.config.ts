import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"lib/utils": "src/lib/utils.ts",
		"hooks/index": "src/hooks/index.ts",
		"layouts/index": "src/components/layouts/index.ts",
	},
	format: ["esm"],
	dts: true,
	clean: true,
	external: [
		"react",
		"react-dom",
		"@radix-ui/react-dialog",
		"@radix-ui/react-dropdown-menu",
		"@radix-ui/react-slot",
		"@tanstack/react-table",
		"sonner",
		"lucide-react",
	],
	jsx: "automatic",
});
