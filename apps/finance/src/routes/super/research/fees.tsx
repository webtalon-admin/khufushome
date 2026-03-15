import { Card, CardContent, Input } from "@khufushome/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { DataFreshness } from "../../../components/super/DataFreshness";
import { SuperNav } from "../../../components/super/SuperNav";
import {
	fetchFundFees,
	fetchFundReferences,
} from "../../../lib/super-api";
import {
	feeDragOverTime,
	totalFeeOnBalance,
	totalFeePct,
} from "../../../lib/super-analysis";
import type { FundReference } from "../../../lib/super-types";

export const Route = createFileRoute("/super/research/fees")({
	component: FeeImpactPage,
});

const BALANCE_TIERS = [50_000, 100_000, 200_000, 500_000];

const FUND_COLOURS: Record<string, string> = {
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
};

function fmtCurrency(n: number): string {
	return new Intl.NumberFormat("en-AU", {
		style: "currency",
		currency: "AUD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n);
}

function fundShortLabel(fundId: string, refs: FundReference[]): string {
	const ref = refs.find((r) => r.id === fundId);
	return ref ? ref.name : fundId;
}

function FeeImpactPage() {
	const { data: fees = [], isLoading } = useQuery({
		queryKey: ["fund-fees"],
		queryFn: fetchFundFees,
	});

	const { data: fundRefs = [] } = useQuery({
		queryKey: ["fund-references"],
		queryFn: fetchFundReferences,
		staleTime: 1000 * 60 * 60,
	});

	const [calcBalance, setCalcBalance] = useState(100_000);
	const [dragYears, setDragYears] = useState(30);
	const [dragReturn, setDragReturn] = useState(8);

	// Fee comparison at multiple balance tiers
	const comparisonData = useMemo(() => {
		return BALANCE_TIERS.map((bal) => {
			const row: Record<string, string | number> = {
				balance: `$${(bal / 1000).toFixed(0)}k`,
				balanceRaw: bal,
			};
			for (const f of fees) {
				row[f.fund_id] = Math.round(totalFeeOnBalance(f, bal));
			}
			return row;
		});
	}, [fees]);

	// Interactive calculator
	const calcResults = useMemo(() => {
		return fees
			.map((f) => ({
				fundId: f.fund_id,
				name: fundShortLabel(f.fund_id, fundRefs),
				totalFee: Math.round(totalFeeOnBalance(f, calcBalance)),
				feePct: totalFeePct(f),
				adminFlat: f.admin_fee_flat,
				colour: FUND_COLOURS[f.fund_id] ?? "#94a3b8",
			}))
			.sort((a, b) => a.totalFee - b.totalFee);
	}, [fees, fundRefs, calcBalance]);

	// Cumulative fee drag
	const dragData = useMemo(() => {
		if (fees.length === 0) return [];
		return feeDragOverTime(fees, calcBalance, dragReturn, dragYears);
	}, [fees, calcBalance, dragReturn, dragYears]);

	const hasData = fees.length > 0;

	return (
		<div className="space-y-6">
			<SuperNav />
			<div>
				<h1 className="font-display text-2xl font-bold text-foreground">
					Fee Impact
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Compare fund fees, calculate your cost, and see cumulative fee drag over time.
				</p>
			</div>

			<DataFreshness />

			{isLoading ? (
				<Card>
					<CardContent className="p-5 space-y-3">
						{Array.from({ length: 3 }, (_, i) => (
							<div
								key={`skel-${i.toString()}`}
								className="h-10 animate-pulse rounded bg-muted"
							/>
						))}
					</CardContent>
				</Card>
			) : !hasData ? (
				<Card>
					<CardContent className="flex flex-col items-center py-16">
						<p className="text-sm font-medium text-foreground">
							No fee data available
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Run the APRA pipeline (<code>pnpm pipeline:apra</code>) or{" "}
							<code>supabase db reset</code> to populate fee data.
						</p>
					</CardContent>
				</Card>
			) : (
				<>
					{/* Fee Comparison Grouped Bar Chart */}
					<Card>
						<CardContent className="p-5">
							<h3 className="text-sm font-semibold text-foreground mb-4">
								Annual Fees at Different Balance Levels
							</h3>
							<ResponsiveContainer width="100%" height={420}>
								<BarChart data={comparisonData}>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-border"
									/>
									<XAxis
										dataKey="balance"
										className="text-xs"
									/>
									<YAxis
										className="text-xs"
										tickFormatter={(v: number) => `$${v.toLocaleString()}`}
									/>
									<Tooltip
										content={({ payload, label }) => {
											if (!payload?.length) return null;
											const sorted = [...payload].sort(
												(a, b) => Number(a.value) - Number(b.value),
											);
											return (
												<div className="rounded-lg border bg-background p-3 shadow-md min-w-[200px]">
													<p className="text-xs font-medium text-foreground mb-2">
														Balance: {label}
													</p>
													{sorted.map((entry) => (
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
																{fundShortLabel(
																	entry.dataKey as string,
																	fundRefs,
																)}
															</span>
															<span className="font-medium text-foreground tabular-nums">
																{fmtCurrency(Number(entry.value))}
															</span>
														</div>
													))}
												</div>
											);
										}}
									/>
									<Legend
										formatter={(value: string) =>
											fundShortLabel(value, fundRefs)
										}
									/>
									{fees.map((f) => (
										<Bar
											key={f.fund_id}
											dataKey={f.fund_id}
											fill={FUND_COLOURS[f.fund_id] ?? "#94a3b8"}
										/>
									))}
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Interactive Fee Calculator */}
					<Card>
						<CardContent className="p-5">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4">
								<h3 className="text-sm font-semibold text-foreground">
									Fee Calculator
								</h3>
								<div className="flex items-center gap-3">
									<label className="text-xs text-muted-foreground whitespace-nowrap">
										Your Balance
									</label>
									<Input
										type="number"
										step={10000}
										min={0}
										className="h-8 w-36 text-sm tabular-nums"
										value={calcBalance}
										onChange={(e) => setCalcBalance(Number(e.target.value))}
									/>
								</div>
							</div>
							<div className="overflow-x-auto">
								<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{calcResults.map((r, idx) => (
										<div
											key={r.fundId}
											className="rounded-lg border p-3 flex flex-col gap-1"
										>
											<div className="flex items-center gap-2">
												<span
													className="size-2.5 rounded-full shrink-0"
													style={{ backgroundColor: r.colour }}
												/>
												<span className="text-sm font-medium text-foreground truncate">
													{r.name}
												</span>
												{idx === 0 && (
													<span className="ml-auto text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
														Cheapest
													</span>
												)}
											</div>
											<p className="text-xl font-bold tabular-nums text-foreground">
												{fmtCurrency(r.totalFee)}
												<span className="text-xs font-normal text-muted-foreground">
													/yr
												</span>
											</p>
											<p className="text-xs text-muted-foreground tabular-nums">
												{r.feePct.toFixed(2)}% + {fmtCurrency(r.adminFlat)} flat
											</p>
										</div>
									))}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Cumulative Fee Drag Chart */}
					<Card>
						<CardContent className="p-5">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-4">
								<div>
									<h3 className="text-sm font-semibold text-foreground">
										Cumulative Fee Drag Over Time
									</h3>
									<p className="text-xs text-muted-foreground mt-0.5">
										Total fees paid over {dragYears} years starting from{" "}
										{fmtCurrency(calcBalance)} at {dragReturn}% p.a. return.
									</p>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex items-center gap-1.5">
										<label className="text-xs text-muted-foreground">
											Years
										</label>
										<Input
											type="number"
											min={5}
											max={50}
											className="h-8 w-16 text-sm tabular-nums"
											value={dragYears}
											onChange={(e) => setDragYears(Number(e.target.value))}
										/>
									</div>
									<div className="flex items-center gap-1.5">
										<label className="text-xs text-muted-foreground">
											Return %
										</label>
										<Input
											type="number"
											step={0.5}
											min={0}
											max={20}
											className="h-8 w-16 text-sm tabular-nums"
											value={dragReturn}
											onChange={(e) => setDragReturn(Number(e.target.value))}
										/>
									</div>
								</div>
							</div>
							<ResponsiveContainer width="100%" height={400}>
								<LineChart data={dragData}>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-border"
									/>
									<XAxis
										dataKey="year"
										className="text-xs"
										label={{
											value: "Year",
											position: "insideBottomRight",
											offset: -5,
											className: "text-xs fill-muted-foreground",
										}}
									/>
									<YAxis
										className="text-xs"
										tickFormatter={(v: number) =>
											v >= 1_000_000
												? `$${(v / 1_000_000).toFixed(1)}M`
												: v >= 1000
													? `$${(v / 1000).toFixed(0)}k`
													: `$${v}`
										}
									/>
									<Tooltip
										content={({ payload, label }) => {
											if (!payload?.length) return null;
											const sorted = [...payload].sort(
												(a, b) => Number(a.value) - Number(b.value),
											);
											return (
												<div className="rounded-lg border bg-background p-3 shadow-md min-w-[200px]">
													<p className="text-xs font-medium text-foreground mb-2">
														Year {label}
													</p>
													{sorted.map((entry) => (
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
																{fundShortLabel(
																	entry.dataKey as string,
																	fundRefs,
																)}
															</span>
															<span className="font-medium text-foreground tabular-nums">
																{fmtCurrency(Number(entry.value))}
															</span>
														</div>
													))}
												</div>
											);
										}}
									/>
									<Legend
										formatter={(value: string) =>
											fundShortLabel(value, fundRefs)
										}
									/>
									{fees.map((f) => (
										<Line
											key={f.fund_id}
											type="monotone"
											dataKey={f.fund_id}
											stroke={FUND_COLOURS[f.fund_id] ?? "#94a3b8"}
											strokeWidth={2}
											dot={false}
											connectNulls
										/>
									))}
								</LineChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Fee Breakdown Table */}
					<Card>
						<CardContent className="p-0">
							<div className="border-b px-5 py-3">
								<h3 className="text-sm font-semibold text-foreground">
									Fee Structure Breakdown
								</h3>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b text-left text-muted-foreground">
											<th className="px-4 py-2.5 font-medium">Fund</th>
											<th className="px-3 py-2.5 font-medium text-right">
												Admin (flat)
											</th>
											<th className="px-3 py-2.5 font-medium text-right">
												Admin %
											</th>
											<th className="px-3 py-2.5 font-medium text-right">
												Investment %
											</th>
											<th className="px-3 py-2.5 font-medium text-right">
												Perf. %
											</th>
											<th className="px-3 py-2.5 font-medium text-right">
												Trans. %
											</th>
											<th className="px-3 py-2.5 font-medium text-right">
												Total %
											</th>
											<th className="px-3 py-2.5 font-medium text-right">
												on $50k
											</th>
											<th className="px-3 py-2.5 font-medium text-right">
												on $100k
											</th>
										</tr>
									</thead>
									<tbody>
										{fees
											.map((f) => ({
												...f,
												total: totalFeePct(f),
												on50k: Math.round(totalFeeOnBalance(f, 50000)),
												on100k: Math.round(totalFeeOnBalance(f, 100000)),
											}))
											.sort((a, b) => a.on50k - b.on50k)
											.map((f) => (
												<tr
													key={f.fund_id}
													className="border-b last:border-0 hover:bg-muted/30"
												>
													<td className="px-4 py-2.5 font-medium whitespace-nowrap">
														<div className="flex items-center gap-2">
															<span
																className="size-2.5 rounded-full"
																style={{
																	backgroundColor:
																		FUND_COLOURS[f.fund_id] ??
																		"#94a3b8",
																}}
															/>
															{fundShortLabel(f.fund_id, fundRefs)}
														</div>
													</td>
													<td className="px-3 py-2.5 text-right tabular-nums">
														{fmtCurrency(f.admin_fee_flat)}
													</td>
													<td className="px-3 py-2.5 text-right tabular-nums">
														{f.admin_fee_pct.toFixed(2)}%
													</td>
													<td className="px-3 py-2.5 text-right tabular-nums">
														{f.investment_fee_pct.toFixed(2)}%
													</td>
													<td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
														{f.performance_fee_pct != null
															? `${f.performance_fee_pct.toFixed(2)}%`
															: "—"}
													</td>
													<td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
														{f.transaction_cost_pct != null
															? `${f.transaction_cost_pct.toFixed(2)}%`
															: "—"}
													</td>
													<td className="px-3 py-2.5 text-right tabular-nums font-medium">
														{f.total.toFixed(2)}%
													</td>
													<td className="px-3 py-2.5 text-right tabular-nums font-medium">
														{fmtCurrency(f.on50k)}
													</td>
													<td className="px-3 py-2.5 text-right tabular-nums font-medium">
														{fmtCurrency(f.on100k)}
													</td>
												</tr>
											))}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
