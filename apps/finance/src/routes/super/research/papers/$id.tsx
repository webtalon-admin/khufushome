import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/super/research/papers/$id")({
	component: FundPaperDetailPage,
});

function FundPaperDetailPage() {
	const { id } = Route.useParams();
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Fund Research Paper
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Detailed research report for fund: {id}
			</p>
		</div>
	);
}
