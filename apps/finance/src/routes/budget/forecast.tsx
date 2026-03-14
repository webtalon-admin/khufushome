import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/budget/forecast")({
	component: ForecastPage,
});

function ForecastPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Budget Forecast
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Forward projection — 12-month horizon.
			</p>
		</div>
	);
}
