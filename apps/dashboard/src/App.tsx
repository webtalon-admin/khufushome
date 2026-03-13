import { useAuth, useSignOut } from "@khufushome/auth";
import { LoginPage } from "./pages/LoginPage";

export function App() {
	const { user, loading } = useAuth();
	const { signOut } = useSignOut();

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-surface">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
			</div>
		);
	}

	if (!user) {
		return <LoginPage />;
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-surface font-sans">
			<h1 className="text-4xl font-bold text-text-primary">
				KhufusHome Dashboard
			</h1>
			<p className="mt-2 text-lg text-text-secondary">
				Welcome, {user.email}
			</p>
			<div className="mt-6 flex gap-3">
				<span className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white">
					3D View
				</span>
				<span className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">
					Finance
				</span>
				<button
					type="button"
					onClick={() => signOut()}
					className="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
				>
					Sign Out
				</button>
			</div>
		</div>
	);
}
