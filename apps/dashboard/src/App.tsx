import { ProtectedRoute, useAuth, useSignOut } from "@khufushome/auth";
import { LoginPage } from "./pages/LoginPage";

function Dashboard() {
	const { user } = useAuth();
	const { signOut } = useSignOut();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-surface font-sans">
			<h1 className="text-4xl font-bold text-text-primary">
				KhufusHome Dashboard
			</h1>
			<p className="mt-2 text-lg text-text-secondary">
				Welcome, {user?.email}
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

export function App() {
	return (
		<ProtectedRoute fallbackUnauthenticated={<LoginPage />}>
			<Dashboard />
		</ProtectedRoute>
	);
}
