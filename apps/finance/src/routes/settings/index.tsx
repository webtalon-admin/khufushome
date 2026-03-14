import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/")({
	component: SettingsPage,
});

function SettingsPage() {
	return (
		<div>
			<h1 className="font-display text-2xl font-bold text-foreground">
				Settings
			</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Categories, CSV column mappings, and price refresh configuration.
			</p>
		</div>
	);
}
