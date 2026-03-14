import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tax/")({
	component: TaxPage,
});

function TaxPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Tax
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Tax year overview — Australian tax estimation.
			</p>
		</div>
	);
}
