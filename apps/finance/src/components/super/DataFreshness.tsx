import { Badge, Button, Card, CardContent } from "@khufushome/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Loader2,
	RefreshCw,
	Terminal,
} from "lucide-react";
import { fetchLatestPipelineLogs, invokeEdgeFunction } from "../../lib/super-api";
import type { PipelineLog } from "../../lib/super-types";

function relativeTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return new Date(iso).toLocaleDateString("en-AU", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-AU", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatSourceDate(iso: string): string {
	return new Date(iso).toLocaleDateString("en-AU", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function freshnessBadge(log: PipelineLog | undefined): {
	label: string;
	variant: "default" | "secondary" | "destructive" | "outline";
} {
	if (!log) return { label: "No data", variant: "outline" };
	if (log.status === "error") return { label: "Error", variant: "destructive" };
	if (log.status === "running") return { label: "Running", variant: "secondary" };
	const age = Date.now() - new Date(log.started_at).getTime();
	const days = age / (1000 * 60 * 60 * 24);
	if (days < 7) return { label: "Fresh", variant: "default" };
	if (days < 30) return { label: `${Math.floor(days)}d old`, variant: "secondary" };
	return { label: "Stale", variant: "destructive" };
}

function StatusIcon({ status }: { status: PipelineLog["status"] }) {
	if (status === "success")
		return <CheckCircle2 className="size-3.5 text-green-500" />;
	if (status === "error")
		return <AlertCircle className="size-3.5 text-red-500" />;
	return <Loader2 className="size-3.5 animate-spin text-muted-foreground" />;
}

interface PipelineRowProps {
	label: string;
	log: PipelineLog | undefined;
	onRefresh?: () => void;
	refreshing?: boolean;
	manualNote?: string;
}

function PipelineRow({
	label,
	log,
	onRefresh,
	refreshing,
	manualNote,
}: PipelineRowProps) {
	const badge = freshnessBadge(log);

	return (
		<div className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0">
			<div className="flex items-center gap-2.5 min-w-0 flex-1">
				{log ? <StatusIcon status={log.status} /> : <Clock className="size-3.5 text-muted-foreground" />}
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-foreground truncate">{label}</span>
						<Badge variant={badge.variant} className="text-[10px] px-1.5 py-0 shrink-0">
							{badge.label}
						</Badge>
					</div>
					{log ? (
						<div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
							<span className="text-[11px] text-muted-foreground" title={formatDate(log.started_at)}>
								Last run: {relativeTime(log.started_at)}
							</span>
							{log.source_date && (
								<span className="text-[11px] text-muted-foreground">
									Data as of: {formatSourceDate(log.source_date)}
								</span>
							)}
							{log.status === "success" && log.rows_upserted > 0 && (
								<span className="text-[11px] text-muted-foreground">
									{log.rows_upserted.toLocaleString()} rows
								</span>
							)}
						</div>
					) : (
						<p className="text-[11px] text-muted-foreground mt-0.5">Never run</p>
					)}
					{log?.status === "error" && log.error_message && (
						<p className="text-[11px] text-red-500 mt-0.5 truncate" title={log.error_message}>
							{log.error_message}
						</p>
					)}
				</div>
			</div>
			<div className="shrink-0">
				{onRefresh ? (
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-xs"
						disabled={refreshing}
						onClick={onRefresh}
					>
						{refreshing ? (
							<Loader2 className="mr-1 size-3 animate-spin" />
						) : (
							<RefreshCw className="mr-1 size-3" />
						)}
						Refresh
					</Button>
				) : manualNote ? (
					<span className="flex items-center gap-1 text-[10px] text-muted-foreground">
						<Terminal className="size-3" />
						{manualNote}
					</span>
				) : null}
			</div>
		</div>
	);
}

export function DataFreshness() {
	const queryClient = useQueryClient();

	const { data: logs } = useQuery({
		queryKey: ["pipeline-logs"],
		queryFn: fetchLatestPipelineLogs,
		refetchInterval: 30_000,
	});

	const yoursuperMut = useMutation({
		mutationFn: () => invokeEdgeFunction("yoursuper-refresh"),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["pipeline-logs"] });
			queryClient.invalidateQueries({ queryKey: ["fund-references"] });
			queryClient.invalidateQueries({ queryKey: ["fund-returns"] });
		},
	});

	const btcMut = useMutation({
		mutationFn: () => invokeEdgeFunction("btc-price-refresh"),
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["pipeline-logs"] });
			queryClient.invalidateQueries({ queryKey: ["btc-prices"] });
		},
	});

	const allLogs = logs
		? [logs.apra_ingest, logs.yoursuper_refresh, logs.btc_price_refresh].filter(Boolean)
		: [];
	const oldestRun = allLogs.length > 0
		? allLogs.reduce((oldest, l) =>
			l && (!oldest || new Date(l.started_at) < new Date(oldest.started_at)) ? l : oldest,
		)
		: null;

	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-center justify-between mb-2">
					<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Data Freshness
					</h3>
					{oldestRun && (
						<span className="text-[11px] text-muted-foreground flex items-center gap-1">
							<Clock className="size-3" />
							Oldest: {relativeTime(oldestRun.started_at)}
						</span>
					)}
				</div>

				<div>
					<PipelineRow
						label="APRA Fund Data"
						log={logs?.apra_ingest}
						manualNote="pnpm pipeline:apra"
					/>
					<PipelineRow
						label="APRA Allocations"
						log={logs?.apra_saa}
						manualNote="pnpm pipeline:apra"
					/>
					<PipelineRow
						label="ATO YourSuper"
						log={logs?.yoursuper_refresh}
						onRefresh={() => yoursuperMut.mutate()}
						refreshing={yoursuperMut.isPending}
					/>
					<PipelineRow
						label="BTC Prices"
						log={logs?.btc_price_refresh}
						onRefresh={() => btcMut.mutate()}
						refreshing={btcMut.isPending}
					/>
				</div>

				{yoursuperMut.data && !yoursuperMut.data.ok && (
					<p className="text-xs text-red-500 mt-2">
						YourSuper: {yoursuperMut.data.error}
					</p>
				)}
				{btcMut.data && !btcMut.data.ok && (
					<p className="text-xs text-red-500 mt-2">
						BTC: {btcMut.data.error}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
