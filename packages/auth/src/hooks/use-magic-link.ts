import { useCallback, useState } from "react";
import { getSupabaseClient } from "../client";

/**
 * Returns a function to send a magic-link (passwordless) sign-in email.
 */
export function useMagicLink() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);

	const sendMagicLink = useCallback(
		async (email: string, redirectTo?: string) => {
			setLoading(true);
			setError(null);
			setSent(false);

			const supabase = getSupabaseClient();
			const { error: authError } = await supabase.auth.signInWithOtp({
				email,
				options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
			});

			setLoading(false);

			if (authError) {
				setError(authError.message);
				return { error: authError.message };
			}

			setSent(true);
			return { error: null };
		},
		[],
	);

	return { sendMagicLink, loading, error, sent };
}
