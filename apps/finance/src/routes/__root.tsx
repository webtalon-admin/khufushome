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
	useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { LucideIcon } from "lucide-react";
import {
	BarChart3,
	Briefcase,
	Calculator,
	ChevronRight,
	CreditCard,
	FileText,
	Home,
	Landmark,
	BookOpen,
	LineChart,
	LogOut,
	PieChart,
	PiggyBank,
	Settings,
	TrendingUp,
	User,
	Wallet,
} from "lucide-react";
import { useState } from "react";
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

interface NavChild {
	to: string;
	label: string;
	icon: LucideIcon;
}

interface NavItem {
	to: string;
	label: string;
	icon: LucideIcon;
	children?: NavChild[];
}

const sidebarNavItems: NavItem[] = [
	{ to: "/", label: "Home", icon: Home },
	{ to: "/accounts", label: "Accounts", icon: Wallet },
	{ to: "/transactions", label: "Transactions", icon: CreditCard },
	{ to: "/loans", label: "Loans", icon: Landmark },
	{ to: "/portfolio", label: "Portfolio", icon: LineChart },
	{
		to: "/super",
		label: "Super",
		icon: PiggyBank,
		children: [
			{ to: "/super/analysis", label: "Overview", icon: BarChart3 },
			{ to: "/super/analysis/historical", label: "Historical", icon: LineChart },
			{ to: "/super/analysis/projections", label: "Projections", icon: TrendingUp },
			{ to: "/super/research", label: "Research", icon: FileText },
			{ to: "/super/research/allocations", label: "Allocations", icon: PieChart },
			{ to: "/super/research/fees", label: "Fees", icon: Calculator },
		{ to: "/super/research/papers", label: "Papers", icon: BookOpen },
		],
	},
	{ to: "/budget", label: "Budget", icon: Briefcase },
	{ to: "/tax", label: "Tax", icon: Calculator },
	{ to: "/settings", label: "Settings", icon: Settings },
];

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

function SidebarNavLink({
	to,
	icon: Icon,
	label,
	isActive,
	indent,
}: {
	to: string;
	icon: LucideIcon;
	label: string;
	isActive: boolean;
	indent?: boolean;
}) {
	return (
		<Link
			to={to}
			className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${indent ? "pl-10" : ""} ${
				isActive
					? "bg-sidebar-accent text-sidebar-foreground"
					: "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
			}`}
		>
			<Icon className="size-4" />
			{label}
		</Link>
	);
}

function SidebarNav() {
	const matchRoute = useMatchRoute();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isSuperSection = pathname.startsWith("/super");
	const [superOpen, setSuperOpen] = useState(isSuperSection);

	return (
		<nav className="flex-1 space-y-1 px-3 py-4">
			{sidebarNavItems.map((item) => {
				const isActive =
					item.to === "/"
						? matchRoute({ to: "/", fuzzy: false })
						: matchRoute({ to: item.to, fuzzy: true });

				if (item.children) {
					return (
						<div key={item.to}>
							<button
								type="button"
								onClick={() => setSuperOpen((v) => !v)}
								className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
									isActive
										? "bg-sidebar-accent text-sidebar-foreground"
										: "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
								}`}
							>
								<item.icon className="size-4" />
								{item.label}
								<ChevronRight
									className={`ml-auto size-4 transition-transform duration-200 ${superOpen ? "rotate-90" : ""}`}
								/>
							</button>

							<div
								className={`overflow-hidden transition-all duration-200 ${superOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
							>
								<SidebarNavLink
									to={item.to}
									icon={item.icon}
									label="Dashboard"
									isActive={
										!!matchRoute({ to: item.to, fuzzy: false })
									}
									indent
								/>
								{item.children.map((child) => {
									const childActive = !!matchRoute({
										to: child.to,
										fuzzy: child.to.endsWith("/research")
											? false
											: true,
									});
									return (
										<SidebarNavLink
											key={child.to}
											to={child.to}
											icon={child.icon}
											label={child.label}
											isActive={childActive}
											indent
										/>
									);
								})}
							</div>
						</div>
					);
				}

				return (
					<SidebarNavLink
						key={item.to}
						to={item.to}
						icon={item.icon}
						label={item.label}
						isActive={!!isActive}
					/>
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
