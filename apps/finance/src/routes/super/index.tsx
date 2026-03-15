import { Card, CardContent } from "@khufushome/ui";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
	BarChart3,
	Calculator,
	FileText,
	LineChart,
	PieChart,
	TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/super/")({
	component: SuperLandingPage,
});

const sections = [
	{
		title: "Analysis — Overview",
		description: "Enter quarterly snapshots, view balance and contributions.",
		to: "/super/analysis",
		icon: BarChart3,
	},
	{
		title: "Historical Performance",
		description:
			"Compare your fund vs alternatives and SMSF Bitcoin what-if.",
		to: "/super/analysis/historical",
		icon: LineChart,
	},
	{
		title: "Projections",
		description: "Future balance projections based on contribution scenarios.",
		to: "/super/analysis/projections",
		icon: TrendingUp,
	},
	{
		title: "Research — Fund Returns",
		description: "APRA quarterly and annual return data for tracked funds.",
		to: "/super/research",
		icon: FileText,
	},
	{
		title: "Research — Allocations",
		description: "Strategic asset allocation breakdowns by fund.",
		to: "/super/research/allocations",
		icon: PieChart,
	},
	{
		title: "Research — Fees",
		description: "Admin, investment, and total fee comparison.",
		to: "/super/research/fees",
		icon: Calculator,
	},
] as const;

function SuperLandingPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-display text-2xl font-bold text-foreground">
					Superannuation
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Super fund tracking — analysis, research, and projections.
				</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{sections.map((s) => (
					<Link key={s.to} to={s.to} className="group">
						<Card className="h-full transition-colors group-hover:border-primary/40">
							<CardContent className="flex items-start gap-4 p-5">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<s.icon className="size-5" />
								</div>
								<div>
									<p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
										{s.title}
									</p>
									<p className="mt-1 text-xs text-muted-foreground leading-relaxed">
										{s.description}
									</p>
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
