import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/loans/")({
	component: LoansPage,
});

function LoansPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Loans
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				All loans overview — mortgage, novated lease, personal, BTC-backed.
			</p>
		</div>
	);
}
