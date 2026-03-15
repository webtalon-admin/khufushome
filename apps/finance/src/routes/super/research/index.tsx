import { createFileRoute } from "@tanstack/react-router";
import { SuperNav } from "../../../components/super/SuperNav";

export const Route = createFileRoute("/super/research/")({
	component: SuperResearchLandingPage,
});

function SuperResearchLandingPage() {
	return (
		<div className="space-y-6">
			<SuperNav />
			<div>
				<h1 className="font-display text-2xl font-bold text-foreground">
					Super Research — Fund Returns
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Market-wide fund analysis — APRA quarterly and annual return data.
				</p>
			</div>
		</div>
	);
}
