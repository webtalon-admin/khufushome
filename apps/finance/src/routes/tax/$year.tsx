import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tax/$year")({
	component: TaxYearPage,
});

function TaxYearPage() {
	const { year } = Route.useParams();
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Tax Year {year}
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Detailed tax breakdown and estimate for FY {year}.
			</p>
		</div>
	);
}
