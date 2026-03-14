import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Finance Home
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Total net worth, asset breakdown, and navigation to all sections.
			</p>

			<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
					<p className="text-sm font-medium text-muted-foreground">Net Worth</p>
					<p className="mt-1 font-mono text-2xl font-bold text-foreground">—</p>
				</div>
				<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
					<p className="text-sm font-medium text-muted-foreground">Income</p>
					<p className="mt-1 font-mono text-2xl font-bold text-foreground">—</p>
				</div>
				<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
					<p className="text-sm font-medium text-muted-foreground">Expenses</p>
					<p className="mt-1 font-mono text-2xl font-bold text-foreground">—</p>
				</div>
				<div className="rounded-xl border border-border bg-card p-6 shadow-sm">
					<p className="text-sm font-medium text-muted-foreground">Investments</p>
					<p className="mt-1 font-mono text-2xl font-bold text-foreground">—</p>
				</div>
			</div>

			<p className="mt-6 text-sm text-muted-foreground">
				Data will populate as accounts and transactions are added.
			</p>
		</div>
	);
}
