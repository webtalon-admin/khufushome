import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/loans/$id")({
	component: LoanDetailPage,
});

function LoanDetailPage() {
	const { id } = Route.useParams();
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Loan Detail
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Loan {id} — type-specific detail view with payment history.
			</p>
		</div>
	);
}
