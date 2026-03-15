import { Card, CardContent } from "@khufushome/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { DataFreshness } from "../../../components/super/DataFreshness";
import { SuperNav } from "../../../components/super/SuperNav";
import {
	fetchFundAllocations,
	fetchFundReferences,
} from "../../../lib/super-api";
import type { FundReference } from "../../../lib/super-types";
import {
	ASSET_CLASSES,
	ASSET_CLASS_LABELS,
	DEFENSIVE_ASSETS,
	GROWTH_ASSETS,
} from "../../../lib/super-types";
import type { AssetClass } from "../../../lib/super-types";

export const Route = createFileRoute("/super/research/allocations")({
	component: AllocationsPage,
});

const ASSET_COLOURS: Record<AssetClass, string> = {
	australian_equities: "#3b82f6",
	international_equities: "#06b6d4",
	property: "#f59e0b",
	infrastructure: "#8b5cf6",
	private_equity: "#ec4899",
	alternatives: "#f97316",
	fixed_income: "#22c55e",
	cash: "#94a3b8",
};

function fundShortLabel(fundId: string, refs: FundReference[]): string {
	const ref = refs.find((r) => r.id === fundId);
	return ref ? ref.name : fundId;
}

function AllocationsPage() {
	const { data: allocations = [], isLoading } = useQuery({
		queryKey: ["fund-allocations"],
		queryFn: fetchFundAllocations,
	});

	const { data: fundRefs = [] } = useQuery({
		queryKey: ["fund-references"],
		queryFn: fetchFundReferences,
		staleTime: 1000 * 60 * 60,
	});

	const [viewMode, setViewMode] = useState<"stacked" | "growth-defensive">(
		"stacked",
	);

	const normalised = useMemo(() => {
		return allocations.map((a) => {
			let total = 0;
			for (const cls of ASSET_CLASSES) total += a[cls] ?? 0;
			const scale = total > 110 ? 100 / total : 1;
			const out = { ...a };
			for (const cls of ASSET_CLASSES) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(out as any)[cls] =
					a[cls] != null ? Math.round(a[cls]! * scale * 100) / 100 : null;
			}
			return out;
		});
	}, [allocations]);

	const stackedData = useMemo(() => {
		return normalised.map((a) => {
			const row: Record<string, string | number> = {
				fundId: a.fund_id,
				name: fundShortLabel(a.fund_id, fundRefs),
			};
			for (const cls of ASSET_CLASSES) {
				row[cls] = a[cls] ?? 0;
			}
			return row;
		});
	}, [normalised, fundRefs]);

	const growthDefensiveData = useMemo(() => {
		return normalised.map((a) => {
			let growth = 0;
			let defensive = 0;
			for (const cls of GROWTH_ASSETS) {
				growth += a[cls] ?? 0;
			}
			for (const cls of DEFENSIVE_ASSETS) {
				defensive += a[cls] ?? 0;
			}
			return {
				fundId: a.fund_id,
				name: fundShortLabel(a.fund_id, fundRefs),
				Growth: Math.round(growth * 10) / 10,
				Defensive: Math.round(defensive * 10) / 10,
			};
		}).sort((a, b) => b.Growth - a.Growth);
	}, [normalised, fundRefs]);

	return (
		<div className="space-y-6">
			<SuperNav />
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-display text-2xl font-bold text-foreground">
						Asset Allocations
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Compare strategic asset allocation across tracked super funds.
					</p>
				</div>
				<div className="flex gap-1 rounded-lg border p-1">
					<button
						type="button"
						className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
							viewMode === "stacked"
								? "bg-primary text-primary-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
						onClick={() => setViewMode("stacked")}
					>
						By Asset Class
					</button>
					<button
						type="button"
						className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
							viewMode === "growth-defensive"
								? "bg-primary text-primary-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
						onClick={() => setViewMode("growth-defensive")}
					>
						Growth vs Defensive
					</button>
				</div>
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
			) : allocations.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center py-16">
						<p className="text-sm font-medium text-foreground">
							No allocation data available
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Run the APRA pipeline (<code>pnpm pipeline:apra</code>) or seed
							data (<code>supabase db reset</code>) to populate fund allocations.
						</p>
					</CardContent>
				</Card>
			) : viewMode === "stacked" ? (
				<>
					{/* Stacked Bar Chart */}
					<Card>
						<CardContent className="p-5">
							<h3 className="text-sm font-semibold text-foreground mb-4">
								Strategic Asset Allocation by Fund
							</h3>
							<ResponsiveContainer width="100%" height={Math.max(400, allocations.length * 55)}>
								<BarChart
									data={stackedData}
									layout="vertical"
									margin={{ left: 20, right: 20 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-border"
										horizontal={false}
									/>
									<XAxis
										type="number"
										domain={[0, 100]}
										allowDataOverflow
										ticks={[0, 20, 40, 60, 80, 100]}
										tickFormatter={(v: number) => `${Math.round(v)}%`}
										className="text-xs"
									/>
									<YAxis
										type="category"
										dataKey="name"
										width={130}
										className="text-xs"
										tick={{ fontSize: 11 }}
									/>
									<Tooltip
										content={({ payload, label }) => {
											if (!payload?.length) return null;
											return (
												<div className="rounded-lg border bg-background p-3 shadow-md min-w-[180px]">
													<p className="text-xs font-medium text-foreground mb-2">
														{label}
													</p>
													{payload
														.filter((e) => Number(e.value) > 0)
														.map((entry) => (
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
																			backgroundColor:
																				entry.color,
																		}}
																	/>
																	{ASSET_CLASS_LABELS[
																		entry.dataKey as AssetClass
																	] ?? (entry.dataKey as string)}
																</span>
																<span className="font-medium text-foreground tabular-nums">
																	{Number(entry.value).toFixed(1)}%
																</span>
															</div>
														))}
												</div>
											);
										}}
									/>
									<Legend
										formatter={(value: string) =>
											ASSET_CLASS_LABELS[value as AssetClass] ?? value
										}
									/>
									{ASSET_CLASSES.map((cls) => (
										<Bar
											key={cls}
											dataKey={cls}
											stackId="allocation"
											fill={ASSET_COLOURS[cls]}
											radius={0}
										/>
									))}
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Detail Table */}
					<Card>
						<CardContent className="p-0">
							<div className="border-b px-5 py-3">
								<h3 className="text-sm font-semibold text-foreground">
									Allocation Breakdown (%)
								</h3>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b text-left text-muted-foreground">
											<th className="px-4 py-2.5 font-medium">Fund</th>
											{ASSET_CLASSES.map((cls) => (
												<th
													key={cls}
													className="px-3 py-2.5 font-medium text-right whitespace-nowrap"
												>
													{ASSET_CLASS_LABELS[cls]}
												</th>
											))}
											<th className="px-3 py-2.5 font-medium text-right">
												Total
											</th>
										</tr>
									</thead>
									<tbody>
										{normalised.map((a) => {
											const total = ASSET_CLASSES.reduce(
												(sum, cls) => sum + (a[cls] ?? 0),
												0,
											);
											return (
												<tr
													key={a.fund_id}
													className="border-b last:border-0 hover:bg-muted/30"
												>
													<td className="px-4 py-2.5 font-medium whitespace-nowrap">
														{fundShortLabel(a.fund_id, fundRefs)}
													</td>
													{ASSET_CLASSES.map((cls) => (
														<td
															key={cls}
															className="px-3 py-2.5 text-right tabular-nums"
														>
															{a[cls] != null
																? `${a[cls]!.toFixed(1)}`
																: "—"}
														</td>
													))}
													<td className="px-3 py-2.5 text-right tabular-nums font-medium">
														{total > 0
															? `${total.toFixed(1)}`
															: "—"}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</>
			) : (
				<>
					{/* Growth vs Defensive Bar Chart */}
					<Card>
						<CardContent className="p-5">
							<h3 className="text-sm font-semibold text-foreground mb-4">
								Growth vs Defensive Split
							</h3>
							<ResponsiveContainer width="100%" height={Math.max(400, allocations.length * 55)}>
								<BarChart
									data={growthDefensiveData}
									layout="vertical"
									margin={{ left: 20, right: 20 }}
								>
									<CartesianGrid
										strokeDasharray="3 3"
										className="stroke-border"
										horizontal={false}
									/>
									<XAxis
										type="number"
										domain={[0, 100]}
										allowDataOverflow
										ticks={[0, 20, 40, 60, 80, 100]}
										tickFormatter={(v: number) => `${Math.round(v)}%`}
										className="text-xs"
									/>
									<YAxis
										type="category"
										dataKey="name"
										width={130}
										className="text-xs"
										tick={{ fontSize: 11 }}
									/>
									<Tooltip
										content={({ payload, label }) => {
											if (!payload?.length) return null;
											return (
												<div className="rounded-lg border bg-background p-3 shadow-md">
													<p className="text-xs font-medium text-foreground mb-2">
														{label}
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
																		backgroundColor:
																			entry.color,
																	}}
																/>
																{entry.dataKey as string}
															</span>
															<span className="font-medium text-foreground tabular-nums">
																{Number(entry.value).toFixed(1)}%
															</span>
														</div>
													))}
												</div>
											);
										}}
									/>
									<Legend />
									<Bar
										dataKey="Growth"
										stackId="split"
										fill="#3b82f6"
										radius={0}
									>
										{growthDefensiveData.map((entry) => (
											<Cell
												key={entry.fundId}
												fill="#3b82f6"
											/>
										))}
									</Bar>
									<Bar
										dataKey="Defensive"
										stackId="split"
										fill="#94a3b8"
										radius={0}
									>
										{growthDefensiveData.map((entry) => (
											<Cell
												key={entry.fundId}
												fill="#94a3b8"
											/>
										))}
									</Bar>
								</BarChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>

					{/* Growth/Defensive Summary Cards */}
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{growthDefensiveData.map((d) => (
							<Card key={d.fundId}>
								<CardContent className="p-4">
									<p className="text-sm font-medium text-foreground">
										{d.name}
									</p>
									<div className="mt-2 flex items-center gap-2">
										<div className="flex-1">
											<div className="flex h-4 overflow-hidden rounded-full">
												<div
													className="bg-blue-500 transition-all"
													style={{ width: `${d.Growth}%` }}
												/>
												<div
													className="bg-slate-400 transition-all"
													style={{ width: `${d.Defensive}%` }}
												/>
											</div>
										</div>
									</div>
									<div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
										<span>
											Growth{" "}
											<span className="font-medium text-blue-600 dark:text-blue-400">
												{d.Growth}%
											</span>
										</span>
										<span>
											Defensive{" "}
											<span className="font-medium text-slate-600 dark:text-slate-400">
												{d.Defensive}%
											</span>
										</span>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</>
			)}
		</div>
	);
}
