import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type { SupabaseClient };

let _client: SupabaseClient | null = null;

/**
 * Creates (or returns the cached) Supabase client.
 *
 * Call once at app startup with the URL + anon key, then import
 * `getSupabaseClient()` anywhere else to reuse the same instance.
 */
export function createSupabaseClient(
	supabaseUrl: string,
	anonKey: string,
): SupabaseClient {
	if (_client) return _client;

	_client = createClient(supabaseUrl, anonKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: true,
		},
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

/** Reset the cached client — useful for testing. */
export function resetSupabaseClient(): void {
	_client = null;
}
