export {
	createSupabaseClient,
	getSupabaseClient,
	resetSupabaseClient,
} from "./client";
export type { SupabaseClient, CreateSupabaseClientOptions } from "./client";
export { initAuth } from "./init";

export {
	useAuth,
	useRequireAuth,
	useSignIn,
	useSignOut,
} from "./hooks/use-auth";
export { useRole } from "./hooks/use-role";
export type { UserRole } from "./hooks/use-role";
