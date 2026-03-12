import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import type { KhufusEnv } from "./env.ts";
import { getEnv, loadConfig } from "./env.ts";

const _thisDir = dirname(fileURLToPath(import.meta.url));

/**
 * Vite plugin that reads `config/env.yaml` based on `KHUFUS_ENV`
 * and injects the resolved config as compile-time constants.
 *
 * When KHUFUS_ENV=prod, .env files are NOT loaded. All VITE_* secrets
 * must be exported in the shell session before running the dev server:
 *
 *   export VITE_SUPABASE_ANON_KEY=<key>
 *   KHUFUS_ENV=prod pnpm dev
 *
 * This prevents prod secrets from ever being written to disk.
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
				// In prod mode, point envDir to a non-existent path so Vite
				// skips loading .env / .env.local files. Secrets must come
				// from shell env vars (export VITE_SUPABASE_ANON_KEY=...).
				// In local mode, Vite loads .env.local as usual.
				...(appEnv === "prod"
					? { envDir: resolve(_thisDir, ".khufus-no-env") }
					: {}),
				define: {
					__KHUFUS_ENV__: JSON.stringify(appEnv),
					__KHUFUS_CONFIG__: JSON.stringify(cfg),
				},
			};
		},

		configResolved() {
			const label = appEnv === "prod" ? "PRODUCTION" : "LOCAL";
			console.log(`  \x1b[36m[khufus]\x1b[0m env = \x1b[33m${label}\x1b[0m`);
			if (appEnv === "prod") {
				console.log(
					"  \x1b[36m[khufus]\x1b[0m .env files disabled — secrets must be exported in shell",
				);
			}
		},
	};
}
