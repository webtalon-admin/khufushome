import { Link, useRouterState } from "@tanstack/react-router";
import {
	BarChart3,
	Calculator,
	ChevronRight,
	FileText,
	LineChart,
	PieChart,
	PiggyBank,
	TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavTab {
	to: string;
	label: string;
	icon: LucideIcon;
	matchExact?: boolean;
}

const analysisTabs: NavTab[] = [
	{ to: "/super/analysis", label: "Overview", icon: BarChart3, matchExact: true },
	{ to: "/super/analysis/historical", label: "Historical", icon: LineChart },
	{ to: "/super/analysis/projections", label: "Projections", icon: TrendingUp },
];

const researchTabs: NavTab[] = [
	{ to: "/super/research", label: "Returns", icon: FileText, matchExact: true },
	{ to: "/super/research/allocations", label: "Allocations", icon: PieChart },
	{ to: "/super/research/fees", label: "Fees", icon: Calculator },
];

function resolveSection(pathname: string): {
	sectionLabel: string;
	tabs: NavTab[];
} | null {
	if (pathname.startsWith("/super/analysis")) {
		return { sectionLabel: "Analysis", tabs: analysisTabs };
	}
	if (pathname.startsWith("/super/research")) {
		return { sectionLabel: "Research", tabs: researchTabs };
	}
	if (pathname === "/super/calculator") {
		return { sectionLabel: "Calculator", tabs: [] };
	}
	return null;
}

export function SuperNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const section = resolveSection(pathname);

	if (!section) return null;

	return (
		<div className="mb-6 space-y-3">
			<nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
				<Link
					to="/super"
					className="flex items-center gap-1.5 transition-colors hover:text-foreground"
				>
					<PiggyBank className="size-3.5" />
					Super
				</Link>
				<ChevronRight className="size-3" />
				<span className="font-medium text-foreground">
					{section.sectionLabel}
				</span>
			</nav>

			{section.tabs.length > 0 && (
				<div className="flex gap-1 rounded-lg bg-muted/50 p-1">
					{section.tabs.map((tab) => {
						const isActive = tab.matchExact
							? pathname === tab.to || pathname === `${tab.to}/`
							: pathname.startsWith(tab.to);

						return (
							<Link
								key={tab.to}
								to={tab.to}
								className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
									isActive
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<tab.icon className="size-3.5" />
								{tab.label}
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
