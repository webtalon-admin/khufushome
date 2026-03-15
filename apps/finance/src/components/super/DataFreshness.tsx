import { Badge, Button } from "@khufushome/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	CheckCircle2,
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
	return (
		<div className="flex items-center justify-between gap-3">
			<div className="flex items-center gap-2 min-w-0">
				{log ? <StatusIcon status={log.status} /> : <div className="size-3.5" />}
				<span className="text-sm text-foreground truncate">{label}</span>
				{log && (
					<span className="text-xs text-muted-foreground whitespace-nowrap">
						{relativeTime(log.started_at)}
						{log.status === "success" && log.rows_upserted > 0 && (
							<> &middot; {log.rows_upserted} rows</>
						)}
					</span>
				)}
				{log?.status === "error" && log.error_message && (
					<Badge variant="destructive" className="text-[10px] px-1.5 py-0">
						failed
					</Badge>
				)}
				{!log && (
					<span className="text-xs text-muted-foreground">never run</span>
				)}
			</div>
			<div>
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

	return (
		<div className="rounded-lg border bg-card p-4 space-y-3">
			<h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				Data Sources
			</h3>
			<div className="space-y-2.5">
				<PipelineRow
					label="APRA Fund Data"
					log={logs?.apra_ingest}
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
			{(yoursuperMut.data && !yoursuperMut.data.ok) && (
				<p className="text-xs text-red-500 mt-2">
					YourSuper: {yoursuperMut.data.error}
				</p>
			)}
			{(btcMut.data && !btcMut.data.ok) && (
				<p className="text-xs text-red-500 mt-2">
					BTC: {btcMut.data.error}
				</p>
			)}
		</div>
	);
}
