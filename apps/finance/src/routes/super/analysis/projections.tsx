import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/super/analysis/projections")({
	component: SuperProjectionsPage,
});

function SuperProjectionsPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Super Analysis — Projections
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Future balance modelling with scenarios and salary sacrifice impact.
			</p>
		</div>
	);
}
