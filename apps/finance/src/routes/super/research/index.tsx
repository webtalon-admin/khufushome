import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/super/research/")({
	component: SuperResearchLandingPage,
});

function SuperResearchLandingPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Super Research
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Market-wide fund analysis — allocations, fees, and research papers.
			</p>
		</div>
	);
}
