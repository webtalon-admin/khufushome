import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/super/research/allocations")({
	component: AllocationsPage,
});

function AllocationsPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Asset Allocations
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Compare fund asset allocations and growth/defensive splits.
			</p>
		</div>
	);
}
