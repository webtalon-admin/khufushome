import { ProtectedRoute, useAuth, useRole, useSignOut } from "@khufushome/auth";
import { getClientConfig } from "@khufushome/config/client";
import {
	AppShell,
	Button,
	SubdomainNav,
	ThemeToggle,
	type AppUrls,
} from "@khufushome/ui";
import { LogOut, User } from "lucide-react";
import { LoginPage } from "./pages/LoginPage";

const cfg = getClientConfig();

const appUrls: AppUrls = {
	dashboard: cfg.apps.dashboard_url,
	finance: cfg.apps.finance_url,
	threedimension: cfg.apps.threedimension_url,
};

function UserMenu() {
	const { user } = useAuth();
	const { role } = useRole();
	const { signOut } = useSignOut();

	return (
		<div className="flex items-center gap-3">
			<ThemeToggle />
			<div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
				<User className="size-4" />
				<span>{user?.email}</span>
				{role && (
					<span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
						{role}
					</span>
				)}
			</div>
			<Button variant="ghost" size="sm" onClick={() => signOut()}>
				<LogOut className="size-4" />
				<span className="hidden sm:inline">Sign Out</span>
			</Button>
		</div>
	);
}

function Sidebar() {
	return (
		<div className="flex h-full flex-col">
			<div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
				<div className="size-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 shadow-sm" />
				<span className="font-display text-lg font-bold text-sidebar-foreground">
					KhufusHome
				</span>
			</div>

			<SubdomainNav urls={appUrls} activeApp="threedimension" />

			<div className="mt-auto border-t border-sidebar-border p-3">
				<p className="px-3 text-xs text-sidebar-foreground/40">
					v0.1.0 &middot; Phase 2
				</p>
			</div>
		</div>
	);
}

function ThreeDContent() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				3D House View
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Interactive 3D model of your home with live device states.
			</p>

			<div className="mt-8 flex items-center justify-center rounded-xl border border-border bg-card p-16 shadow-sm">
				<div className="text-center">
					<div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
						<svg
							aria-hidden="true"
							className="size-8 text-muted-foreground"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
							/>
						</svg>
					</div>
					<p className="font-display text-lg font-semibold text-foreground">
						3D Viewer Coming Soon
					</p>
					<p className="mt-1 text-sm text-muted-foreground">
						The interactive house model will be available in Phase 4.
					</p>
				</div>
			</div>
		</div>
	);
}

export function App() {
	return (
		<ProtectedRoute fallbackUnauthenticated={<LoginPage />}>
			<AppShell sidebar={<Sidebar />} headerRight={<UserMenu />}>
				<ThreeDContent />
			</AppShell>
		</ProtectedRoute>
	);
}
