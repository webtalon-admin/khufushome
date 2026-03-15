import { createFileRoute } from "@tanstack/react-router";
import { SuperNav } from "../../../../components/super/SuperNav";

export const Route = createFileRoute("/super/research/papers/$id")({
	component: FundPaperDetailPage,
});

function FundPaperDetailPage() {
	const { id } = Route.useParams();
	return (
		<div className="space-y-6">
			<SuperNav />
			<div>
				<h1 className="font-display text-2xl font-bold text-foreground">
					Fund Research Paper
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Detailed research report for fund: {id}
				</p>
			</div>
		</div>
	);
}
