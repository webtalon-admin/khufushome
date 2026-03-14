import { createSupabaseClient, getSupabaseClient } from "./client";

interface InitAuthOptions {
	supabaseUrl: string;
	anonKey: string;
	cookieDomain: string;
}

/**
 * Initialise the Supabase auth client and restore the session from cookies.
 *
 * Call once in each app's entry point (main.tsx) before rendering.
 * Session cookies are scoped to `cookieDomain`, enabling cross-subdomain
 * sharing (e.g. login on `khufushome.com`, stay logged in on
 * `finance.khufushome.com`).
 */
export async function initAuth(opts: InitAuthOptions): Promise<void> {
	createSupabaseClient(opts);

	await getSupabaseClient().auth.getSession();
}
