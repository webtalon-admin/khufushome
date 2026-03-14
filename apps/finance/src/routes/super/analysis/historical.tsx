import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/super/analysis/historical")({
	component: SuperHistoricalPage,
});

function SuperHistoricalPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Super Analysis — Historical Performance
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Balance over time with fund-switch markers and what-if comparisons.
			</p>
		</div>
	);
}
