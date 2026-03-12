export {
	createSupabaseClient,
	getSupabaseClient,
	resetSupabaseClient,
} from "./client";
export type { SupabaseClient } from "./client";

export {
	useAuth,
	useRequireAuth,
	useSignIn,
	useSignUp,
	useSignOut,
} from "./hooks/use-auth";
export { useMagicLink } from "./hooks/use-magic-link";
