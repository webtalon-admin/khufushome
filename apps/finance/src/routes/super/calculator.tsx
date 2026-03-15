import { createFileRoute } from "@tanstack/react-router";
import { SuperNav } from "../../components/super/SuperNav";

export const Route = createFileRoute("/super/calculator")({
	component: SalSacCalculatorPage,
});

function SalSacCalculatorPage() {
	return (
		<div className="space-y-6">
			<SuperNav />
			<div>
				<h1 className="font-display text-2xl font-bold text-foreground">
					Salary Sacrifice Calculator
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Model the impact of salary sacrificing into super.
				</p>
			</div>
		</div>
	);
}
