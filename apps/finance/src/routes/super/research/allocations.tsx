import { createFileRoute } from "@tanstack/react-router";
import { SuperNav } from "../../../components/super/SuperNav";

export const Route = createFileRoute("/super/research/allocations")({
	component: AllocationsPage,
});

function AllocationsPage() {
	return (
		<div className="space-y-6">
			<SuperNav />
			<div>
				<h1 className="font-display text-2xl font-bold text-foreground">
					Asset Allocations
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Compare fund asset allocations and growth/defensive splits.
				</p>
			</div>
		</div>
	);
}
