import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/portfolio/")({
	component: PortfolioPage,
});

function PortfolioPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Portfolio
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Holdings, current values, and performance.
			</p>
		</div>
	);
}
