import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "../client";

export interface AuthState {
	user: User | null;
	session: Session | null;
	loading: boolean;
}

/**
 * Subscribes to the Supabase auth state and returns the current
 * user, session, and loading flag.
 *
 * Must be called after `createSupabaseClient()` has initialised
 * the singleton.
 */
export function useAuth(): AuthState {
	const [state, setState] = useState<AuthState>({
		user: null,
		session: null,
		loading: true,
	});
	const mounted = useRef(true);

	useEffect(() => {
		mounted.current = true;
		const supabase = getSupabaseClient();

		supabase.auth.getSession().then(({ data: { session } }) => {
			if (mounted.current) {
				setState({
					user: session?.user ?? null,
					session,
					loading: false,
				});
			}
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (mounted.current) {
				setState({
					user: session?.user ?? null,
					session,
					loading: false,
				});
			}
		});

		return () => {
			mounted.current = false;
			subscription.unsubscribe();
		};
	}, []);

	return state;
}

/**
 * Returns the current auth state and calls `onUnauthenticated` when
 * the user is not signed in (after loading completes).
 *
 * Use this to protect pages that require authentication. The callback
 * is router-agnostic — wire it to your router's redirect/navigate.
 */
export function useRequireAuth(onUnauthenticated: () => void): AuthState {
	const auth = useAuth();
	const called = useRef(false);

	useEffect(() => {
		if (!auth.loading && !auth.user && !called.current) {
			called.current = true;
			onUnauthenticated();
		}
		if (auth.user) {
			called.current = false;
		}
	}, [auth.loading, auth.user, onUnauthenticated]);

	return auth;
}

/**
 * Returns a sign-in function for email/password authentication.
 */
export function useSignIn() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const signIn = useCallback(
		async (email: string, password: string) => {
			setLoading(true);
			setError(null);

			const supabase = getSupabaseClient();
			const { error: authError } =
				await supabase.auth.signInWithPassword({ email, password });

			setLoading(false);

			if (authError) {
				setError(authError.message);
				return { error: authError.message };
			}
			return { error: null };
		},
		[],
	);

	return { signIn, loading, error };
}

/**
 * Returns a sign-out function.
 */
export function useSignOut() {
	const [loading, setLoading] = useState(false);

	const signOut = useCallback(async () => {
		setLoading(true);
		const supabase = getSupabaseClient();
		await supabase.auth.signOut();
		setLoading(false);
	}, []);

	return { signOut, loading };
}
