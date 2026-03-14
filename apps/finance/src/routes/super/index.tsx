import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/super/")({
	component: SuperLandingPage,
});

function SuperLandingPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Superannuation
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Super fund tracking — analysis and research.
			</p>
		</div>
	);
}
