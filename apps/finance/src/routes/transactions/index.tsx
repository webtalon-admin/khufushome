import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/transactions/")({
	component: TransactionsPage,
});

function TransactionsPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Transactions
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Transaction list, filters, and CSV import.
			</p>
		</div>
	);
}
