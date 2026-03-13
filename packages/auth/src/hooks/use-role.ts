import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "../client";
import { useAuth } from "./use-auth";

export type UserRole = "admin" | "member";

interface RoleState {
	role: UserRole | null;
	isAdmin: boolean;
	isMember: boolean;
	loading: boolean;
}

/**
 * Reads the authenticated user's role from the `profiles` table.
 * Re-fetches whenever the auth user changes.
 */
export function useRole(): RoleState {
	const { user, loading: authLoading } = useAuth();
	const [state, setState] = useState<RoleState>({
		role: null,
		isAdmin: false,
		isMember: false,
		loading: true,
	});
	const prevUserId = useRef<string | null>(null);

	useEffect(() => {
		if (authLoading) return;

		if (!user) {
			setState({ role: null, isAdmin: false, isMember: false, loading: false });
			prevUserId.current = null;
			return;
		}

		if (user.id === prevUserId.current) return;
		prevUserId.current = user.id;

		let cancelled = false;
		setState((s) => ({ ...s, loading: true }));

		getSupabaseClient()
			.from("profiles")
			.select("role")
			.eq("id", user.id)
			.single()
			.then(({ data, error }) => {
				if (cancelled) return;

				if (error || !data) {
					setState({
						role: null,
						isAdmin: false,
						isMember: false,
						loading: false,
					});
					return;
				}

				const role = data.role as UserRole;
				setState({
					role,
					isAdmin: role === "admin",
					isMember: role === "member",
					loading: false,
				});
			});

		return () => {
			cancelled = true;
		};
	}, [user, authLoading]);

	return state;
}
