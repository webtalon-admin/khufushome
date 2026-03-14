import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/accounts/")({
	component: AccountsPage,
});

function AccountsPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Accounts
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				All financial accounts with current balances.
			</p>
		</div>
	);
}
