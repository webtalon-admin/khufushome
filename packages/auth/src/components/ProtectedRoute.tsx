import type { ReactNode } from "react";
import { useAuth } from "../hooks/use-auth";
import type { UserRole } from "../hooks/use-role";
import { useRole } from "../hooks/use-role";

interface ProtectedRouteProps {
	children: ReactNode;
	/** Rendered while the auth/role state is loading. */
	fallbackLoading?: ReactNode;
	/** Rendered when the user is not authenticated. */
	fallbackUnauthenticated: ReactNode;
	/**
	 * If set, the user must have one of these roles to see the children.
	 * When the user is authenticated but lacks the required role,
	 * `fallbackUnauthorized` is rendered instead.
	 */
	requiredRoles?: UserRole[];
	/** Rendered when the user is authenticated but lacks the required role. */
	fallbackUnauthorized?: ReactNode;
}

const DefaultLoader = (
	<div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
		<div
			style={{
				width: 32,
				height: 32,
				border: "4px solid #e2e8f0",
				borderTopColor: "#3b82f6",
				borderRadius: "50%",
				animation: "spin 0.6s linear infinite",
			}}
		/>
		<style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
	</div>
);

/**
 * Wraps content that requires authentication (and optionally a specific role).
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute fallbackUnauthenticated={<LoginPage />}>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * <ProtectedRoute
 *   fallbackUnauthenticated={<LoginPage />}
 *   requiredRoles={["admin"]}
 *   fallbackUnauthorized={<p>Admin only</p>}
 * >
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
	children,
	fallbackLoading = DefaultLoader,
	fallbackUnauthenticated,
	requiredRoles,
	fallbackUnauthorized,
}: ProtectedRouteProps) {
	const { user, loading: authLoading } = useAuth();
	const { role, loading: roleLoading } = useRole();

	if (authLoading) return <>{fallbackLoading}</>;

	if (!user) return <>{fallbackUnauthenticated}</>;

	if (requiredRoles && requiredRoles.length > 0) {
		if (roleLoading) return <>{fallbackLoading}</>;

		if (!role || !requiredRoles.includes(role)) {
			return <>{fallbackUnauthorized ?? fallbackUnauthenticated}</>;
		}
	}

	return <>{children}</>;
}
