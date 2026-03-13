import { Box, LayoutDashboard, Wallet } from "lucide-react";
import { cn } from "../../lib/utils";

export type AppId = "dashboard" | "finance" | "threedimension";

export interface AppUrls {
	dashboard: string;
	finance: string;
	threedimension: string;
}

export interface SubdomainNavProps {
	urls: AppUrls;
	activeApp: AppId;
	className?: string;
}

const apps: { id: AppId; label: string; icon: typeof LayoutDashboard }[] = [
	{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ id: "finance", label: "Finance", icon: Wallet },
	{ id: "threedimension", label: "3D View", icon: Box },
];

export function SubdomainNav({ urls, activeApp, className }: SubdomainNavProps) {
	return (
		<nav className={cn("flex flex-col gap-1 p-3", className)}>
			<p className="mb-2 px-3 font-display text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
				Apps
			</p>
			{apps.map(({ id, label, icon: Icon }) => {
				const isActive = id === activeApp;
				return (
					<a
						key={id}
						href={urls[id]}
						className={cn(
							"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
							isActive
								? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
								: "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
						)}
						aria-current={isActive ? "page" : undefined}
					>
						<Icon className="size-4 shrink-0" />
						{label}
					</a>
				);
			})}
		</nav>
	);
}
