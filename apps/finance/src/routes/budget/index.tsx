import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/budget/")({
	component: BudgetPage,
});

function BudgetPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Budget
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Monthly budget setup and tracking.
			</p>
		</div>
	);
}
