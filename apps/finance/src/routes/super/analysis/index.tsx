import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/super/analysis/")({
	component: SuperAnalysisOverviewPage,
});

function SuperAnalysisOverviewPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Super Analysis — Overview
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Current balance, AU benchmarks, contributions summary.
			</p>
		</div>
	);
}
