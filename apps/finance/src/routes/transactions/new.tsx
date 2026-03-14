import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/transactions/new")({
	component: NewTransactionPage,
});

function NewTransactionPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				New Transaction
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Manually enter a new transaction.
			</p>
		</div>
	);
}
