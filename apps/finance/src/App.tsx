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

			<SubdomainNav urls={appUrls} activeApp="finance" />

			<div className="mt-auto border-t border-sidebar-border p-3">
				<p className="px-3 text-xs text-sidebar-foreground/40">
					v0.1.0 &middot; Phase 2
				</p>
			</div>
		</div>
	);
}

function FinanceContent() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Finance
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Budgets, loans, investments, and tax tracking.
			</p>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
					<p className="text-sm font-medium text-muted-foreground">Income</p>
					<p className="mt-1 font-mono text-2xl font-bold text-foreground">
						—
					</p>
				</div>
				<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
					<p className="text-sm font-medium text-muted-foreground">Expenses</p>
					<p className="mt-1 font-mono text-2xl font-bold text-foreground">
						—
					</p>
				</div>
				<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
					<p className="text-sm font-medium text-muted-foreground">
						Net Worth
					</p>
					<p className="mt-1 font-mono text-2xl font-bold text-foreground">
						—
					</p>
				</div>
				<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
					<p className="text-sm font-medium text-muted-foreground">
						Investments
					</p>
					<p className="mt-1 font-mono text-2xl font-bold text-foreground">
						—
					</p>
				</div>
			</div>

			<p className="mt-6 text-sm text-muted-foreground">
				Data will be available once the finance module is built in Phase 3.
			</p>
		</div>
	);
}

export function App() {
	return (
		<ProtectedRoute fallbackUnauthenticated={<LoginPage />}>
			<AppShell sidebar={<Sidebar />} headerRight={<UserMenu />}>
				<FinanceContent />
			</AppShell>
		</ProtectedRoute>
	);
}
