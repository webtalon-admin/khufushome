import { ProtectedRoute, useAuth, useRole, useSignOut } from "@khufushome/auth";
import { getClientConfig } from "@khufushome/config/client";
import {
	AppShell,
	Button,
	SubdomainNav,
	ThemeToggle,
	type AppUrls,
} from "@khufushome/ui";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	Link,
	Outlet,
	createRootRouteWithContext,
	useMatchRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import {
	Briefcase,
	Calculator,
	CreditCard,
	Home,
	Landmark,
	LineChart,
	LogOut,
	PiggyBank,
	Settings,
	User,
	Wallet,
} from "lucide-react";
import { LoginPage } from "../pages/LoginPage";

const cfg = getClientConfig();

const appUrls: AppUrls = {
	dashboard: cfg.apps.dashboard_url,
	finance: cfg.apps.finance_url,
	threedimension: cfg.apps.threedimension_url,
};

interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
});

const sidebarNavItems = [
	{ to: "/", label: "Home", icon: Home },
	{ to: "/accounts", label: "Accounts", icon: Wallet },
	{ to: "/transactions", label: "Transactions", icon: CreditCard },
	{ to: "/loans", label: "Loans", icon: Landmark },
	{ to: "/portfolio", label: "Portfolio", icon: LineChart },
	{ to: "/super", label: "Super", icon: PiggyBank },
	{ to: "/budget", label: "Budget", icon: Briefcase },
	{ to: "/tax", label: "Tax", icon: Calculator },
	{ to: "/settings", label: "Settings", icon: Settings },
] as const;

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

function SidebarNav() {
	const matchRoute = useMatchRoute();

	return (
		<nav className="flex-1 space-y-1 px-3 py-4">
			{sidebarNavItems.map((item) => {
				const isActive =
					item.to === "/"
						? matchRoute({ to: "/", fuzzy: false })
						: matchRoute({ to: item.to, fuzzy: true });

				return (
					<Link
						key={item.to}
						to={item.to}
						className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
							isActive
								? "bg-sidebar-accent text-sidebar-foreground"
								: "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
						}`}
					>
						<item.icon className="size-4" />
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}

function SidebarContent() {
	return (
		<div className="flex h-full flex-col">
			<div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
				<div className="size-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 shadow-sm" />
				<span className="font-display text-lg font-bold text-sidebar-foreground">
					KhufusHome
				</span>
			</div>

			<SubdomainNav urls={appUrls} activeApp="finance" />

			<SidebarNav />

			<div className="mt-auto border-t border-sidebar-border p-3">
				<p className="px-3 text-xs text-sidebar-foreground/40">
					v0.1.0 &middot; Phase 3
				</p>
			</div>
		</div>
	);
}

function RootComponent() {
	return (
		<ProtectedRoute fallbackUnauthenticated={<LoginPage />}>
			<AppShell sidebar={<SidebarContent />} headerRight={<UserMenu />}>
				<Outlet />
			</AppShell>
			<ReactQueryDevtools buttonPosition="bottom-left" />
			<TanStackRouterDevtools position="bottom-right" />
		</ProtectedRoute>
	);
}
