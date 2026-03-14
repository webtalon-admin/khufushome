import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/super/research/papers/")({
	component: FundPapersPage,
});

function FundPapersPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Fund Research Papers
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Detailed per-fund research reports.
			</p>
		</div>
	);
}
