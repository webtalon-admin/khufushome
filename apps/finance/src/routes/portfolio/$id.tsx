import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/portfolio/$id")({
	component: AssetDetailPage,
});

function AssetDetailPage() {
	const { id } = Route.useParams();
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Asset Detail
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Asset {id} — trade history and performance.
			</p>
		</div>
	);
}
