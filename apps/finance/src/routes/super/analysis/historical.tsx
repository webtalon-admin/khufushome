import { Button, Card, CardContent, Input } from "@khufushome/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SuperNav } from "../../../components/super/SuperNav";
import { useMemo, useState } from "react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	fetchBtcPrices,
	fetchFundFees,
	fetchFundReferences,
	fetchFundReturns,
	fetchSnapshots,
} from "../../../lib/super-api";
import { personalWhatIf, smsfBtcWhatIf } from "../../../lib/super-analysis";
import type { FundReference } from "../../../lib/super-types";
import { SMSF_DEFAULTS } from "../../../lib/super-types";

export const Route = createFileRoute("/super/analysis/historical")({
	component: SuperHistoricalPage,
});

const FUND_COLOURS: Record<string, string> = {
	actual: "#3b82f6",
	future_super: "#22c55e",
	australian_super: "#f59e0b",
	hostplus_balanced: "#ef4444",
	hostplus_shares_plus: "#ec4899",
	unisuper: "#8b5cf6",
	art_high_growth: "#06b6d4",
	aware_super: "#14b8a6",
	hesta_high_growth: "#f97316",
	rest_super: "#6366f1",
	vanguard_super: "#84cc16",
	smsf_btc: "#F7931A",
};

function fmtCurrency(n: number): string {
	return new Intl.NumberFormat("en-AU", {
		style: "currency",
		currency: "AUD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n);
}

function fundDisplayName(
	fundId: string,
	refs: FundReference[],
): string {
	if (fundId === "actual") return "Actual (Your Fund)";
	if (fundId === "smsf_btc") return "SMSF 100% Bitcoin";
	const ref = refs.find((r) => r.id === fundId);
	return ref ? `${ref.name} — ${ref.option_name}` : fundId;
}

function SuperHistoricalPage() {
	const [selectedFunds, setSelectedFunds] = useState<Set<string>>(
		new Set(["australian_super", "hostplus_balanced", "vanguard_super"]),
	);
	const [showSmsfBtc, setShowSmsfBtc] = useState(true);
	const [showAssumptions, setShowAssumptions] = useState(false);
	const [smsfAnnualCost, setSmsfAnnualCost] = useState(
		SMSF_DEFAULTS.annualCost,
	);
	const [exchangeFeePct, setExchangeFeePct] = useState(
		SMSF_DEFAULTS.exchangeFeePct * 100,
	);

	const { data: snapshots = [] } = useQuery({
		queryKey: ["super-snapshots"],
		queryFn: fetchSnapshots,
	});

	const { data: fundRefs = [] } = useQuery({
		queryKey: ["fund-references"],
		queryFn: fetchFundReferences,
	});

	const { data: fundReturns = [] } = useQuery({
		queryKey: ["fund-returns"],
		queryFn: () => fetchFundReturns(),
	});

	const { data: fundFees = [] } = useQuery({
		queryKey: ["fund-fees"],
		queryFn: fetchFundFees,
	});

	const { data: btcPrices = [] } = useQuery({
		queryKey: ["btc-prices"],
		queryFn: fetchBtcPrices,
	});

	const activeFundIds = useMemo(
		() => Array.from(selectedFunds),
		[selectedFunds],
	);

	const whatIfData = useMemo(
		() => personalWhatIf(snapshots, activeFundIds, fundReturns, fundFees),
		[snapshots, activeFundIds, fundReturns, fundFees],
	);

	const btcResult = useMemo(
		() =>
			showSmsfBtc
				? smsfBtcWhatIf(
						snapshots,
						btcPrices,
						smsfAnnualCost,
						exchangeFeePct / 100,
					)
				: null,
		[snapshots, btcPrices, smsfAnnualCost, exchangeFeePct, showSmsfBtc],
	);

	const chartData = useMemo(() => {
		if (whatIfData.length === 0) return [];

		const btcMap = new Map(
			btcResult?.snapshotValues.map((sv) => [sv.date, sv.audValue]) ?? [],
		);

		return whatIfData.map((point) => ({
			...point,
			...(showSmsfBtc && btcMap.has(point.date)
				? { smsf_btc: btcMap.get(point.date)! }
				: {}),
		}));
	}, [whatIfData, btcResult, showSmsfBtc]);

	const allLineKeys = useMemo(() => {
		const keys = ["actual", ...activeFundIds];
		if (showSmsfBtc && btcResult) keys.push("smsf_btc");
		return keys;
	}, [activeFundIds, showSmsfBtc, btcResult]);

	const toggleFund = (fundId: string) => {
		setSelectedFunds((prev) => {
			const next = new Set(prev);
			if (next.has(fundId)) next.delete(fundId);
			else next.add(fundId);
			return next;
		});
	};

	const hasData = snapshots.length >= 2;

	return (
		<div className="space-y-6">
			<SuperNav />
			<div>
				<h1 className="font-display text-2xl font-bold text-foreground">
					Super Analysis — Historical Performance
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Your actual balance over time vs what-if comparisons with other funds.
				</p>
			</div>

			{!hasData ? (
				<Card>
					<CardContent className="flex flex-col items-center py-16">
						<p className="text-sm font-medium text-foreground">
							Need at least 2 quarterly snapshots
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Go to the Overview tab to add your quarterly statement data.
						</p>
					</CardContent>
				</Card>
			) : (
				<>
					{/* Chart */}
					<Card>
						<CardContent className="p-5">
							<ResponsiveContainer width="100%" height={400}>
								<LineChart data={chartData}>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-border"
									/>
									<XAxis
										dataKey="date"
										className="text-xs"
										tickFormatter={(d: string) =>
											new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", {
												month: "short",
												year: "2-digit",
											})
										}
									/>
									<YAxis
										className="text-xs"
										tickFormatter={(v: number) =>
											`$${(v / 1000).toFixed(0)}k`
										}
									/>
									<Tooltip
										content={({ payload, label }) => {
											if (!payload?.length) return null;
											return (
												<div className="rounded-lg border bg-background p-3 shadow-md">
													<p className="text-xs font-medium text-foreground mb-2">
														{new Date(
															`${label}T00:00:00`,
														).toLocaleDateString("en-AU", {
															day: "numeric",
															month: "short",
															year: "numeric",
														})}
													</p>
													{payload.map((entry) => (
														<div
															key={entry.dataKey as string}
															className="flex items-center justify-between gap-4 text-xs"
														>
															<span
																className="flex items-center gap-1.5"
																style={{ color: entry.color }}
															>
																<span
																	className="inline-block size-2 rounded-full"
																	style={{
																		backgroundColor: entry.color,
																	}}
																/>
																{fundDisplayName(
																	entry.dataKey as string,
																	fundRefs,
																)}
															</span>
															<span className="font-medium text-foreground">
																{fmtCurrency(entry.value as number)}
															</span>
														</div>
													))}
												</div>
											);
										}}
									/>
									<Legend
										formatter={(value: string) =>
											fundDisplayName(value, fundRefs)
										}
									/>
									{allLineKeys.map((key) => (
										<Line
											key={key}
											type="monotone"
											dataKey={key}
											stroke={FUND_COLOURS[key] ?? "#94a3b8"}
											strokeWidth={key === "actual" ? 3 : 1.5}
											strokeDasharray={
												key === "smsf_btc" ? "6 3" : undefined
											}
											dot={key === "actual"}
											connectNulls
										/>
									))}
								</LineChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Fund Selector */}
					<div className="grid gap-4 lg:grid-cols-2">
						<Card>
							<CardContent className="p-5">
								<h3 className="text-sm font-semibold text-foreground mb-3">
									Compare Funds
								</h3>
								<div className="space-y-2">
									{fundRefs.map((ref) => (
										<label
											key={ref.id}
											className="flex items-center gap-2.5 text-sm cursor-pointer"
										>
											<input
												type="checkbox"
												checked={selectedFunds.has(ref.id)}
												onChange={() => toggleFund(ref.id)}
												className="size-4 rounded border-input"
											/>
											<span
												className="inline-block size-2.5 rounded-full"
												style={{
													backgroundColor:
														FUND_COLOURS[ref.id] ?? "#94a3b8",
												}}
											/>
											<span className="text-foreground">
												{ref.name} — {ref.option_name}
											</span>
										</label>
									))}
									<label className="flex items-center gap-2.5 text-sm cursor-pointer border-t pt-2 mt-2">
										<input
											type="checkbox"
											checked={showSmsfBtc}
											onChange={() => setShowSmsfBtc(!showSmsfBtc)}
											className="size-4 rounded border-input"
										/>
										<span
											className="inline-block size-2.5 rounded-full"
											style={{
												backgroundColor: FUND_COLOURS.smsf_btc,
											}}
										/>
										<span className="text-foreground">
											SMSF 100% Bitcoin
										</span>
									</label>
								</div>
							</CardContent>
						</Card>

						{/* SMSF Assumptions */}
						<Card>
							<CardContent className="p-5">
								<button
									type="button"
									className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
									onClick={() => setShowAssumptions(!showAssumptions)}
								>
									SMSF Bitcoin Assumptions
									{showAssumptions ? (
										<ChevronUp className="size-4" />
									) : (
										<ChevronDown className="size-4" />
									)}
								</button>
								{showAssumptions && (
									<div className="mt-4 space-y-3">
										<div className="space-y-1.5">
											<label
												htmlFor="smsf-cost"
												className="text-xs text-muted-foreground"
											>
												Annual SMSF Cost ($)
											</label>
											<Input
												id="smsf-cost"
												type="number"
												step="1"
												value={smsfAnnualCost}
												onChange={(e) =>
													setSmsfAnnualCost(Number(e.target.value))
												}
											/>
											<p className="text-xs text-muted-foreground">
												Audit $1k + Accounting $2k + ASIC $59 + ATO $259
											</p>
										</div>
										<div className="space-y-1.5">
											<label
												htmlFor="exchange-fee"
												className="text-xs text-muted-foreground"
											>
												Exchange Fee (%)
											</label>
											<Input
												id="exchange-fee"
												type="number"
												step="0.1"
												value={exchangeFeePct}
												onChange={(e) =>
													setExchangeFeePct(Number(e.target.value))
												}
											/>
										</div>
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												setSmsfAnnualCost(SMSF_DEFAULTS.annualCost);
												setExchangeFeePct(
													SMSF_DEFAULTS.exchangeFeePct * 100,
												);
											}}
										>
											Reset to Defaults
										</Button>
									</div>
								)}

								{btcResult && (
									<div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
										<div>
											<p className="text-xs text-muted-foreground">
												BTC Accumulated
											</p>
											<p className="text-sm font-semibold text-foreground">
												{btcResult.totalBtc.toFixed(4)} BTC
											</p>
										</div>
										<div>
											<p className="text-xs text-muted-foreground">
												Current Value
											</p>
											<p className="text-sm font-semibold text-foreground">
												{fmtCurrency(btcResult.currentAudValue)}
											</p>
										</div>
										<div>
											<p className="text-xs text-muted-foreground">
												Total Contributed
											</p>
											<p className="text-sm font-semibold text-foreground">
												{fmtCurrency(btcResult.totalContributedAud)}
											</p>
										</div>
										<div>
											<p className="text-xs text-muted-foreground">
												BTC Price (latest)
											</p>
											<p className="text-sm font-semibold text-foreground">
												{fmtCurrency(btcResult.currentBtcPrice)}
											</p>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Opportunity Cost Table */}
					{chartData.length > 0 && (
						<Card>
							<CardContent className="p-0">
								<div className="border-b px-5 py-3">
									<h3 className="text-sm font-semibold text-foreground">
										Opportunity Cost Summary
									</h3>
								</div>
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b text-left text-muted-foreground">
												<th className="px-5 py-2.5 font-medium">Fund</th>
												<th className="px-5 py-2.5 font-medium text-right">
													Final Value
												</th>
												<th className="px-5 py-2.5 font-medium text-right">
													vs Actual
												</th>
											</tr>
										</thead>
										<tbody>
											{allLineKeys.map((key) => {
												const lastPoint = chartData[chartData.length - 1];
												const value = lastPoint[key] as number | undefined;
												if (value == null) return null;
												const diff =
													key === "actual" ? 0 : value - lastPoint.actual;
												return (
													<tr
														key={key}
														className="border-b last:border-0"
													>
														<td className="px-5 py-2.5 flex items-center gap-2">
															<span
																className="inline-block size-2.5 rounded-full"
																style={{
																	backgroundColor:
																		FUND_COLOURS[key] ?? "#94a3b8",
																}}
															/>
															{fundDisplayName(key, fundRefs)}
														</td>
														<td className="px-5 py-2.5 text-right font-medium">
															{fmtCurrency(value)}
														</td>
														<td
															className={`px-5 py-2.5 text-right font-medium ${
																diff > 0
																	? "text-green-600 dark:text-green-400"
																	: diff < 0
																		? "text-red-600 dark:text-red-400"
																		: "text-muted-foreground"
															}`}
														>
															{key === "actual"
																? "—"
																: `${diff >= 0 ? "+" : ""}${fmtCurrency(diff)}`}
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					)}
				</>
			)}
		</div>
	);
}
