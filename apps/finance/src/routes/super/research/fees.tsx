import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/super/research/fees")({
	component: FeeImpactPage,
});

function FeeImpactPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Fee Impact
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Fee comparison, interactive calculator, and cumulative fee drag analysis.
			</p>
		</div>
	);
}
