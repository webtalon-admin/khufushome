import { ProtectedRoute, useAuth, useRole, useSignOut } from "@khufushome/auth";
import { getClientConfig } from "@khufushome/config/client";
import {
	AppShell,
	Button,
	SubdomainNav,
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

			<SubdomainNav urls={appUrls} activeApp="dashboard" />

			<div className="mt-auto border-t border-sidebar-border p-3">
				<p className="px-3 text-xs text-sidebar-foreground/40">
					v0.1.0 &middot; Phase 2
				</p>
			</div>
		</div>
	);
}

function DashboardContent() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Dashboard
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Welcome to KhufusHome. Select an app from the sidebar to get started.
			</p>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<a
					href={appUrls.finance}
					className="group rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/30 hover:shadow-md"
				>
					<h2 className="font-display text-lg font-semibold text-card-foreground group-hover:text-primary">
						Finance
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Budgets, loans, investments, and tax tracking.
					</p>
				</a>

				<a
					href={appUrls.threedimension}
					className="group rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/30 hover:shadow-md"
				>
					<h2 className="font-display text-lg font-semibold text-card-foreground group-hover:text-primary">
						3D House View
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Interactive 3D model of your home with live device states.
					</p>
				</a>

				<div className="rounded-xl border border-border bg-card p-6 shadow-sm opacity-50">
					<h2 className="font-display text-lg font-semibold text-card-foreground">
						Home Assistant
					</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Coming in Phase 4 — device control and automation.
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
				<DashboardContent />
			</AppShell>
		</ProtectedRoute>
	);
}
