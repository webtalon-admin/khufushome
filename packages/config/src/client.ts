/**
 * Browser-safe config reader.
 *
 * Values are injected at compile time by the `khufusEnvPlugin` Vite plugin.
 * This module has zero Node.js dependencies and is safe to import in React code.
 *
 * Usage:
 *   import { getClientConfig, getClientEnv } from "@khufushome/config/client";
 *   const cfg = getClientConfig();
 *   console.log(cfg.supabase.url);
 */

declare const __KHUFUS_ENV__: string;
declare const __KHUFUS_CONFIG__: string;

export interface ClientConfig {
	supabase: {
		url: string;
		auth_cookie_domain: string;
	};
	home_assistant: {
		url: string;
		websocket_url: string;
	};
	mqtt: {
		host: string;
		port: number;
	};
	apps: {
		dashboard_url: string;
		threedimension_url: string;
		finance_url: string;
	};
	features: {
		mock_devices: boolean;
		seed_data: boolean;
	};
}

export type ClientEnv = "local" | "prod";

let _config: ClientConfig | null = null;

export function getClientConfig(): ClientConfig {
	if (_config) return _config;

	if (typeof __KHUFUS_CONFIG__ === "undefined") {
		throw new Error(
			"__KHUFUS_CONFIG__ is not defined. " +
				"Add khufusEnvPlugin() to your vite.config.ts plugins array.",
		);
	}

	_config =
		typeof __KHUFUS_CONFIG__ === "string"
			? JSON.parse(__KHUFUS_CONFIG__)
			: __KHUFUS_CONFIG__;

	return _config as ClientConfig;
}

export function getClientEnv(): ClientEnv {
	if (typeof __KHUFUS_ENV__ === "undefined") {
		throw new Error(
			"__KHUFUS_ENV__ is not defined. " +
				"Add khufusEnvPlugin() to your vite.config.ts plugins array.",
		);
	}
	return __KHUFUS_ENV__ as ClientEnv;
}
