import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export type { SupabaseClient };

export interface CreateSupabaseClientOptions {
	supabaseUrl: string;
	anonKey: string;
	cookieDomain: string;
}

let _client: SupabaseClient | null = null;

/**
 * Creates (or returns the cached) Supabase client with cookie-based
 * session storage for cross-subdomain sharing.
 *
 * Call once at app startup, then use `getSupabaseClient()` everywhere else.
 */
export function createSupabaseClient(
	opts: CreateSupabaseClientOptions,
): SupabaseClient {
	if (_client) return _client;

	const isLocalhost =
		opts.cookieDomain === "localhost" ||
		opts.cookieDomain === "127.0.0.1";

	_client = createBrowserClient(opts.supabaseUrl, opts.anonKey, {
		cookieOptions: {
			domain: opts.cookieDomain,
			path: "/",
			sameSite: "lax",
			secure: !isLocalhost,
		},
		isSingleton: true,
	});

	return _client;
}

/**
 * Returns the existing Supabase client instance.
 * Throws if `createSupabaseClient()` hasn't been called yet.
 */
export function getSupabaseClient(): SupabaseClient {
	if (!_client) {
		throw new Error(
			"Supabase client not initialised. Call createSupabaseClient() first.",
		);
	}
	return _client;
}

/** Reset the cached client -- useful for testing. */
export function resetSupabaseClient(): void {
	_client = null;
}
