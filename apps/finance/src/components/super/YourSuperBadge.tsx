import { Badge, Card, CardContent } from "@khufushome/ui";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ShieldCheck, ShieldX, HelpCircle } from "lucide-react";
import {
	fetchYourSuperStatus,
	fetchFundReferences,
} from "../../lib/super-api";
import type { YourSuperAssessment } from "../../lib/super-types";

interface YourSuperBadgeProps {
	fundId: string | undefined;
}

const ASSESSMENT_CONFIG: Record<
	YourSuperAssessment,
	{ label: string; variant: "default" | "destructive" | "secondary"; icon: typeof ShieldCheck; className: string }
> = {
	performing: {
		label: "Performing",
		variant: "default",
		icon: ShieldCheck,
		className: "bg-green-600 hover:bg-green-600 text-white",
	},
	underperforming: {
		label: "Underperforming",
		variant: "destructive",
		icon: ShieldX,
		className: "",
	},
	not_assessed: {
		label: "Not Assessed",
		variant: "secondary",
		icon: HelpCircle,
		className: "",
	},
};

function fmtPct(n: number | null): string {
	if (n == null) return "—";
	return `${n.toFixed(2)}%`;
}

function fmtCurrency(n: number | null): string {
	if (n == null) return "—";
	return new Intl.NumberFormat("en-AU", {
		style: "currency",
		currency: "AUD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n);
}

function fmtDate(d: string): string {
	return new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function YourSuperBadge({ fundId }: YourSuperBadgeProps) {
	const { data: status, isLoading } = useQuery({
		queryKey: ["yoursuper-status", fundId],
		queryFn: () => fetchYourSuperStatus(fundId!),
		enabled: !!fundId,
		staleTime: 1000 * 60 * 30,
	});

	const { data: refs = [] } = useQuery({
		queryKey: ["fund-references"],
		queryFn: fetchFundReferences,
		staleTime: 1000 * 60 * 60,
	});

	if (!fundId) return null;

	const fundRef = refs.find((r) => r.id === fundId);
	const fundLabel = fundRef ? `${fundRef.name} — ${fundRef.option_name}` : fundId;

	if (isLoading) {
		return (
			<Card>
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="h-6 w-24 animate-pulse rounded bg-muted" />
						<div className="h-4 w-48 animate-pulse rounded bg-muted" />
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!status) {
		return (
			<Card className="border-dashed">
				<CardContent className="flex items-center gap-3 p-4">
					<Badge variant="secondary" className="gap-1.5">
						<HelpCircle className="size-3.5" />
						No YourSuper Data
					</Badge>
					<span className="text-sm text-muted-foreground">
						ATO performance test data not yet available for {fundLabel}.
					</span>
				</CardContent>
			</Card>
		);
	}

	const config = ASSESSMENT_CONFIG[status.assessment];
	const Icon = config.icon;

	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<Badge
							variant={config.variant}
							className={`gap-1.5 text-xs ${config.className}`}
						>
							<Icon className="size-3.5" />
							{config.label}
						</Badge>
						<span className="text-sm font-medium text-foreground">
							ATO YourSuper Performance Test
						</span>
					</div>
					<a
						href="https://www.ato.gov.au/calculators-and-tools/yoursuper-comparison-tool"
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
					>
						ATO YourSuper Tool
						<ExternalLink className="size-3" />
					</a>
				</div>

				<div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4 text-sm">
					<div>
						<p className="text-muted-foreground text-xs">Fund</p>
						<p className="font-medium text-foreground truncate" title={fundLabel}>
							{fundLabel}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground text-xs">Net Return p.a.</p>
						<p className="font-medium tabular-nums text-foreground">
							{fmtPct(status.net_return_pa)}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground text-xs">Fees p.a. (on $50k)</p>
						<p className="font-medium tabular-nums text-foreground">
							{fmtCurrency(status.fees_pa_on_50k)}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground text-xs">Data Date</p>
						<p className="font-medium text-foreground">
							{fmtDate(status.data_date)}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
