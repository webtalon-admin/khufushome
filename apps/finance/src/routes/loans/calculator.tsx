import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/loans/calculator")({
	component: LoanCalculatorPage,
});

function LoanCalculatorPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Loan Calculator
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Novated lease and mortgage calculators.
			</p>
		</div>
	);
}
