import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/super/calculator")({
	component: SalSacCalculatorPage,
});

function SalSacCalculatorPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Salary Sacrifice Calculator
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Model the impact of salary sacrificing into super.
			</p>
		</div>
	);
}
