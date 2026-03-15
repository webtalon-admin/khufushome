import { createFileRoute } from "@tanstack/react-router";
import { SuperNav } from "../../../../components/super/SuperNav";

export const Route = createFileRoute("/super/research/papers/")({
	component: FundPapersPage,
});

function FundPapersPage() {
	return (
		<div className="space-y-6">
			<SuperNav />
			<div>
				<h1 className="font-display text-2xl font-bold text-foreground">
					Fund Research Papers
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Detailed per-fund research reports.
				</p>
			</div>
		</div>
	);
}
