import type { Plugin } from "vite";
import type { KhufusEnv } from "./env.ts";
import { getEnv, loadConfig } from "./env.ts";

/**
 * Vite plugin that reads `config/env.yaml` based on `KHUFUS_ENV`
 * and injects the resolved config as compile-time constants.
 *
 * Usage in vite.config.ts:
 *   import { khufusEnvPlugin } from "@khufushome/config/vite";
 *   export default defineConfig({ plugins: [khufusEnvPlugin()] });
 *
 * In app code:
 *   import { getClientConfig, getClientEnv } from "@khufushome/config/client";
 */
export function khufusEnvPlugin(): Plugin {
	const appEnv: KhufusEnv = getEnv();

	return {
		name: "khufus-env",

		config() {
			const cfg = loadConfig(appEnv);

			return {
				define: {
					__KHUFUS_ENV__: JSON.stringify(appEnv),
					__KHUFUS_CONFIG__: JSON.stringify(cfg),
				},
			};
		},

		configResolved() {
			const label = appEnv === "prod" ? "PRODUCTION" : "LOCAL";
			console.log(`  \x1b[36m[khufus]\x1b[0m env = \x1b[33m${label}\x1b[0m`);
		},
	};
}
