import { Button, Card, CardContent, Input } from "@khufushome/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { SuperNav } from "../../../components/super/SuperNav";
import {
	fetchFundFees,
	fetchFundReferences,
	fetchSnapshots,
	fetchSuperAccounts,
} from "../../../lib/super-api";
import {
	multiProjection,
	totalFeePct as calcTotalFeePct,
} from "../../../lib/super-analysis";
import type { ProjectionInput } from "../../../lib/super-types";

export const Route = createFileRoute("/super/analysis/projections")({
	component: SuperProjectionsPage,
});

const AGE_KEY = "khufushome:user-age";
const DEFAULT_SG_RATE = 0.12;
const DEFAULT_SALARY = 180_000;
const DEFAULT_SALARY_GROWTH = 3;
const DEFAULT_RETIREMENT_AGE = 67;

interface FundProjection {
	id: string;
	fundId: string;
	label: string;
	returnPct: number;
	feePct: number;
	feeFlat: number;
	colour: string;
}

const SCENARIO_COLOURS = [
	"#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
	"#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
];

function fmtCurrency(n: number): string {
	return new Intl.NumberFormat("en-AU", {
		style: "currency",
		currency: "AUD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n);
}

function lookupFees(
	feeLookup: Map<string, { feePct: number; feeFlat: number }>,
	fundId: string,
): { feePct: number; feeFlat: number } {
	return feeLookup.get(fundId) ?? { feePct: 0.5, feeFlat: 0 };
}

let nextId = 1;
function genId() {
	return `proj-${(nextId++).toString()}`;
}

function SuperProjectionsPage() {
	const { data: snapshots = [] } = useQuery({
		queryKey: ["super-snapshots"],
		queryFn: fetchSnapshots,
	});

	const { data: fundRefs = [] } = useQuery({
		queryKey: ["fund-references"],
		queryFn: fetchFundReferences,
		staleTime: 1000 * 60 * 60,
	});

	const { data: fundFees = [] } = useQuery({
		queryKey: ["fund-fees"],
		queryFn: fetchFundFees,
	});

	const { data: accounts = [] } = useQuery({
		queryKey: ["super-accounts"],
		queryFn: fetchSuperAccounts,
	});

	const feeLookup = useMemo(() => {
		const m = new Map<string, { feePct: number; feeFlat: number }>();
		for (const f of fundFees) {
			m.set(f.fund_id, { feePct: calcTotalFeePct(f), feeFlat: f.admin_fee_flat });
		}
		return m;
	}, [fundFees]);

	const activeAccount = accounts.find((a) => a.is_active);
	const activeFundFee = useMemo((): { feePct: number; feeFlat: number } => {
		const fundId = activeAccount?.metadata?.fund_id;
		if (fundId && feeLookup.has(fundId)) return feeLookup.get(fundId)!;
		return { feePct: 0.5, feeFlat: 0 };
	}, [activeAccount, feeLookup]);

	const latestBalance = useMemo(() => {
		if (snapshots.length === 0) return 0;
		const sorted = [...snapshots].sort((a, b) =>
			b.recorded_date.localeCompare(a.recorded_date),
		);
		return sorted[0]!.balance;
	}, [snapshots]);

	// ── User inputs ─────────────────────────────────
	const [currentAge, setCurrentAge] = useState<number>(() => {
		const stored = localStorage.getItem(AGE_KEY);
		return stored ? Number(stored) : 36;
	});
	const [retirementAge, setRetirementAge] = useState(DEFAULT_RETIREMENT_AGE);
	const [salary, setSalary] = useState(DEFAULT_SALARY);
	const [sgRate, setSgRate] = useState(DEFAULT_SG_RATE * 100);
	const [salaryGrowth, setSalaryGrowth] = useState(DEFAULT_SALARY_GROWTH);
	const [voluntary, setVoluntary] = useState(0);
	const [showInputs, setShowInputs] = useState(false);

	// ── Fund projections with per-fund return % ──────
	const [funds, setFunds] = useState<FundProjection[]>([]);
	const scenariosInit = useRef(false);

	useEffect(() => {
		if (scenariosInit.current) return;
		scenariosInit.current = true;

		const fee = activeFundFee;
		setFunds([
			{
				id: genId(),
				fundId: "optimistic",
				label: "Optimistic (10%)",
				returnPct: 10,
				feePct: fee.feePct,
				feeFlat: fee.feeFlat,
				colour: SCENARIO_COLOURS[0]!,
			},
			{
				id: genId(),
				fundId: "expected",
				label: "Expected (8%)",
				returnPct: 8,
				feePct: fee.feePct,
				feeFlat: fee.feeFlat,
				colour: SCENARIO_COLOURS[1]!,
			},
			{
				id: genId(),
				fundId: "conservative",
				label: "Conservative (5.5%)",
				returnPct: 5.5,
				feePct: fee.feePct,
				feeFlat: fee.feeFlat,
				colour: SCENARIO_COLOURS[2]!,
			},
		]);
	}, [activeFundFee]);

	const handleAgeChange = (v: number) => {
		setCurrentAge(v);
		localStorage.setItem(AGE_KEY, String(v));
	};

	const addFundProjection = (refId?: string) => {
		const ref = refId ? fundRefs.find((r) => r.id === refId) : null;
		const fees = ref ? lookupFees(feeLookup, ref.id) : { feePct: 0.5, feeFlat: 0 };
		const idx = funds.length;
		setFunds((prev) => [
			...prev,
			{
				id: genId(),
				fundId: ref?.id ?? `custom-${idx}`,
				label: ref ? `${ref.name} — ${ref.option_name}` : "Custom",
				returnPct: 8,
				feePct: fees.feePct,
				feeFlat: fees.feeFlat,
				colour: SCENARIO_COLOURS[idx % SCENARIO_COLOURS.length]!,
			},
		]);
	};

	const removeFund = (id: string) => {
		setFunds((prev) => prev.filter((f) => f.id !== id));
	};

	const updateFund = (id: string, field: keyof FundProjection, value: number | string) => {
		setFunds((prev) =>
			prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
		);
	};

	// ── Projection computation ──────────────────────
	const chartData = useMemo(() => {
		const annualContribution =
			salary * (sgRate / 100) + voluntary;

		const inputs: ProjectionInput[] = funds.map((f) => ({
			fundId: f.fundId,
			label: f.label,
			annualReturnPct: f.returnPct,
			feePct: f.feePct,
			feeFlat: f.feeFlat,
		}));

		return multiProjection(
			{
				startingBalance: latestBalance,
				annualContribution,
				salaryGrowthRate: salaryGrowth / 100,
				sgRate: sgRate / 100,
				voluntaryAnnual: voluntary,
				currentAge,
				retirementAge,
			},
			inputs,
		);
	}, [latestBalance, salary, sgRate, salaryGrowth, voluntary, currentAge, retirementAge, funds]);

	const yearsToRetire = retirementAge - currentAge;

	return (
		<div className="space-y-6">
			<SuperNav />
			<div>
				<h1 className="font-display text-2xl font-bold text-foreground">
					Super Analysis — Projections
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Forward balance modelling to retirement. Adjust return rates per fund to compare scenarios.
				</p>
			</div>

			{/* Quick Summary */}
			<div className="grid gap-4 sm:grid-cols-4">
				<Card>
					<CardContent className="p-4">
						<p className="text-xs text-muted-foreground">Current Balance</p>
						<p className="mt-0.5 text-lg font-bold text-foreground">
							{fmtCurrency(latestBalance)}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<p className="text-xs text-muted-foreground">Years to Retirement</p>
						<p className="mt-0.5 text-lg font-bold text-foreground">
							{yearsToRetire > 0 ? yearsToRetire : 0}
						</p>
						<p className="text-xs text-muted-foreground">
							Age {currentAge} → {retirementAge}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<p className="text-xs text-muted-foreground">Annual Contribution</p>
						<p className="mt-0.5 text-lg font-bold text-foreground">
							{fmtCurrency(salary * (sgRate / 100) + voluntary)}
						</p>
						<p className="text-xs text-muted-foreground">
							SG {fmtCurrency(salary * (sgRate / 100))} + Vol {fmtCurrency(voluntary)}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<p className="text-xs text-muted-foreground">Scenarios</p>
						<p className="mt-0.5 text-lg font-bold text-foreground">
							{funds.length}
						</p>
						<p className="text-xs text-muted-foreground">
							{funds.map((f) => `${f.returnPct}%`).join(" / ")}
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Projection Chart */}
			{chartData.length > 1 && (
				<Card>
					<CardContent className="p-5">
						<ResponsiveContainer width="100%" height={420}>
							<AreaChart data={chartData}>
								<defs>
									{funds.map((f) => (
										<linearGradient
											key={f.id}
											id={`grad-${f.fundId}`}
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor={f.colour}
												stopOpacity={0.15}
											/>
											<stop
												offset="95%"
												stopColor={f.colour}
												stopOpacity={0}
											/>
										</linearGradient>
									))}
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									className="stroke-border"
								/>
								<XAxis
									dataKey="age"
									className="text-xs"
									tickFormatter={(v: number) => `${v}`}
									label={{
										value: "Age",
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
											: `$${(v / 1000).toFixed(0)}k`
									}
									label={{
										value: "Balance ($)",
										position: "insideTopLeft",
										offset: 0,
										dy: -15,
										className: "text-xs fill-muted-foreground font-medium",
									}}
								/>
								<Tooltip
									content={({ payload, label }) => {
										if (!payload?.length) return null;
										return (
											<div className="rounded-lg border bg-background p-3 shadow-md">
												<p className="text-xs font-medium text-foreground mb-2">
													Age {label}
												</p>
												{payload.map((entry) => {
													const fund = funds.find(
														(f) => f.fundId === entry.dataKey,
													);
													return (
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
																{fund?.label ?? (entry.dataKey as string)}
															</span>
															<span className="font-medium text-foreground">
																{fmtCurrency(Number(entry.value))}
															</span>
														</div>
													);
												})}
											</div>
										);
									}}
								/>
								<Legend
									formatter={(value: string) => {
										const fund = funds.find((f) => f.fundId === value);
										return fund?.label ?? value;
									}}
								/>
								{funds.map((f) => (
									<Area
										key={f.id}
										type="monotone"
										dataKey={f.fundId}
										stroke={f.colour}
										strokeWidth={2}
										fill={`url(#grad-${f.fundId})`}
										connectNulls
									/>
								))}
							</AreaChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			)}

			{/* Per-Fund Return Rate Controls */}
			<Card>
				<CardContent className="p-5">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-sm font-semibold text-foreground">
							Projection Scenarios
						</h3>
						<div className="flex gap-2">
							{fundRefs.length > 0 && (
								<select
									className="h-8 rounded-md border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
									value=""
									onChange={(e) => {
										if (e.target.value) addFundProjection(e.target.value);
										e.target.value = "";
									}}
								>
									<option value="">+ Add tracked fund…</option>
									{fundRefs
										.filter((r) => !funds.some((f) => f.fundId === r.id))
										.map((ref) => (
											<option key={ref.id} value={ref.id}>
												{ref.name} — {ref.option_name}
											</option>
										))}
								</select>
							)}
							<Button
								size="sm"
								variant="outline"
								onClick={() => addFundProjection()}
							>
								<Plus className="mr-1 size-3.5" />
								Custom
							</Button>
						</div>
					</div>

					<div className="space-y-3">
						{funds.map((f) => (
							<div
								key={f.id}
								className="flex items-center gap-3 rounded-lg border p-3"
							>
								<span
									className="size-3 shrink-0 rounded-full"
									style={{ backgroundColor: f.colour }}
								/>
								<div className="flex-1 min-w-0">
									<Input
										className="h-7 text-sm font-medium"
										value={f.label}
										onChange={(e) =>
											updateFund(f.id, "label", e.target.value)
										}
									/>
								</div>
								<div className="flex items-center gap-1.5">
									<label className="text-xs text-muted-foreground whitespace-nowrap">
										Return %
									</label>
									<Input
										type="number"
										step="0.5"
										min="0"
										max="30"
										className="h-7 w-20 text-sm tabular-nums text-right"
										value={f.returnPct}
										onChange={(e) =>
											updateFund(f.id, "returnPct", Number(e.target.value))
										}
									/>
								</div>
								<div className="flex items-center gap-1.5">
									<label className="text-xs text-muted-foreground whitespace-nowrap">
										Fee %
									</label>
									<Input
										type="number"
										step="0.1"
										min="0"
										max="5"
										className="h-7 w-20 text-sm tabular-nums text-right"
										value={f.feePct}
										onChange={(e) =>
											updateFund(f.id, "feePct", Number(e.target.value))
										}
									/>
								</div>
								<div className="flex items-center gap-1.5">
									<label className="text-xs text-muted-foreground whitespace-nowrap">
										Fee $/yr
									</label>
									<Input
										type="number"
										step="10"
										min="0"
										max="500"
										className="h-7 w-20 text-sm tabular-nums text-right"
										value={f.feeFlat}
										onChange={(e) =>
											updateFund(f.id, "feeFlat", Number(e.target.value))
										}
									/>
								</div>
								{funds.length > 1 && (
									<Button
										variant="ghost"
										size="sm"
										className="size-7 p-0 text-destructive hover:text-destructive"
										onClick={() => removeFund(f.id)}
									>
										<Trash2 className="size-3.5" />
									</Button>
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Assumptions Panel */}
			<Card>
				<CardContent className="p-5">
					<button
						type="button"
						className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
						onClick={() => setShowInputs(!showInputs)}
					>
						Personal Assumptions
						{showInputs ? (
							<ChevronUp className="size-4" />
						) : (
							<ChevronDown className="size-4" />
						)}
					</button>
					{showInputs && (
						<div className="mt-4 grid gap-4 sm:grid-cols-3">
							<div className="space-y-1.5">
								<label className="text-xs text-muted-foreground">
									Current Age
								</label>
								<Input
									type="number"
									min={18}
									max={75}
									value={currentAge}
									onChange={(e) => handleAgeChange(Number(e.target.value))}
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs text-muted-foreground">
									Retirement Age
								</label>
								<Input
									type="number"
									min={55}
									max={80}
									value={retirementAge}
									onChange={(e) => setRetirementAge(Number(e.target.value))}
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs text-muted-foreground">
									Annual Salary ($)
								</label>
								<Input
									type="number"
									step={1000}
									min={0}
									value={salary}
									onChange={(e) => setSalary(Number(e.target.value))}
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs text-muted-foreground">
									SG Rate (%)
								</label>
								<Input
									type="number"
									step={0.5}
									min={0}
									max={25}
									value={sgRate}
									onChange={(e) => setSgRate(Number(e.target.value))}
								/>
								<p className="text-xs text-muted-foreground">
									12% from 1 Jul 2026
								</p>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs text-muted-foreground">
									Salary Growth (% p.a.)
								</label>
								<Input
									type="number"
									step={0.5}
									min={0}
									max={15}
									value={salaryGrowth}
									onChange={(e) => setSalaryGrowth(Number(e.target.value))}
								/>
							</div>
							<div className="space-y-1.5">
								<label className="text-xs text-muted-foreground">
									Voluntary Contributions ($/yr)
								</label>
								<Input
									type="number"
									step={500}
									min={0}
									value={voluntary}
									onChange={(e) => setVoluntary(Number(e.target.value))}
								/>
								<p className="text-xs text-muted-foreground">
									Salary sacrifice or personal contributions
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Retirement Summary Table */}
			{chartData.length > 1 && (
				<Card>
					<CardContent className="p-0">
						<div className="border-b px-5 py-3">
							<h3 className="text-sm font-semibold text-foreground">
								Projected Balance at Retirement (Age {retirementAge})
							</h3>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left text-muted-foreground">
										<th className="px-5 py-2.5 font-medium">Scenario</th>
										<th className="px-5 py-2.5 font-medium text-right">
											Return %
										</th>
										<th className="px-5 py-2.5 font-medium text-right">
											Fee %
										</th>
										<th className="px-5 py-2.5 font-medium text-right">
											Fee $/yr
										</th>
										<th className="px-5 py-2.5 font-medium text-right">
											Balance at {retirementAge}
										</th>
										<th className="px-5 py-2.5 font-medium text-right">
											Total Fees Paid
										</th>
										<th className="px-5 py-2.5 font-medium text-right">
											vs Best
										</th>
									</tr>
								</thead>
								<tbody>
									{(() => {
										const lastRow = chartData[chartData.length - 1];
										if (!lastRow) return null;
										const balances = funds.map((f) => {
											const finalBalance = (lastRow[f.fundId] as number) ?? 0;
											// Estimate total fees paid over the projection horizon
											let bal = latestBalance;
											let totalFees = 0;
											const annualContrib = salary * (sgRate / 100) + voluntary;
											let contrib = annualContrib;
											for (let y = 1; y <= yearsToRetire; y++) {
												const fee = (bal * f.feePct) / 100 + f.feeFlat;
												totalFees += fee;
												const gross = bal * (f.returnPct / 100);
												bal = bal + gross - fee + contrib;
												contrib *= 1 + salaryGrowth / 100;
											}
											return { fund: f, balance: finalBalance, totalFees };
										});
										const best = Math.max(
											...balances.map((b) => b.balance),
										);
										return balances.map(({ fund, balance, totalFees }) => {
											const diff = balance - best;
											return (
												<tr
													key={fund.id}
													className="border-b last:border-0 hover:bg-muted/30"
												>
													<td className="px-5 py-2.5">
														<div className="flex items-center gap-2">
															<span
																className="inline-block size-2.5 rounded-full"
																style={{
																	backgroundColor: fund.colour,
																}}
															/>
															<span className="font-medium text-foreground">
																{fund.label}
															</span>
														</div>
													</td>
													<td className="px-5 py-2.5 text-right tabular-nums">
														{fund.returnPct.toFixed(1)}%
													</td>
													<td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
														{fund.feePct.toFixed(2)}%
													</td>
													<td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
														{fmtCurrency(fund.feeFlat)}
													</td>
													<td className="px-5 py-2.5 text-right font-bold tabular-nums">
														{fmtCurrency(balance)}
													</td>
													<td className="px-5 py-2.5 text-right tabular-nums text-red-600 dark:text-red-400">
														{fmtCurrency(totalFees)}
													</td>
													<td
														className={`px-5 py-2.5 text-right tabular-nums font-medium ${
															diff === 0
																? "text-muted-foreground"
																: diff > 0
																	? "text-green-600 dark:text-green-400"
																	: "text-red-600 dark:text-red-400"
														}`}
													>
														{diff === 0
															? "Best"
															: `${fmtCurrency(diff)}`}
													</td>
												</tr>
											);
										});
									})()}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
