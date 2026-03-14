import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/accounts/$id")({
	component: AccountDetailPage,
});

function AccountDetailPage() {
	const { id } = Route.useParams();
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Account Detail
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Account {id} — recent transactions and balance history.
			</p>
		</div>
	);
}
