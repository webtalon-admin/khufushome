import { Card, CardContent } from "@khufushome/ui";
import { useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	type AuBenchmarkRow,
	type Gender,
	AU_BENCHMARK_DATA,
	getBenchmarkForAge,
	getPercentileRank,
} from "../../lib/au-benchmark-data";

const AGE_STORAGE_KEY = "khufushome:user-age";

interface AuBenchmarkCardProps {
	currentBalance: number | null;
}

function fmtCurrency(n: number): string {
	return new Intl.NumberFormat("en-AU", {
		style: "currency",
		currency: "AUD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n);
}

function pctDiff(balance: number, benchmark: number): string {
	const pct = ((balance - benchmark) / benchmark) * 100;
	const sign = pct >= 0 ? "+" : "";
	return `${sign}${pct.toFixed(0)}%`;
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
	{ value: "male", label: "Male" },
	{ value: "female", label: "Female" },
];

type ViewMode = "your-age" | "all-ages";

export function AuBenchmarkCard({
	currentBalance,
}: AuBenchmarkCardProps) {
	const [gender, setGender] = useState<Gender>("male");
	const [viewMode, setViewMode] = useState<ViewMode>("your-age");
	const [userAge, setUserAge] = useState<number | null>(() => {
		const stored = localStorage.getItem(AGE_STORAGE_KEY);
		return stored ? Number(stored) : null;
	});

	const handleAgeChange = (val: string) => {
		const n = val ? Number(val) : null;
		setUserAge(n);
		if (n != null && n >= 18 && n <= 100) {
			localStorage.setItem(AGE_STORAGE_KEY, String(n));
		}
	};

	const ageRow = useMemo(
		() => (userAge != null ? getBenchmarkForAge(userAge) : null),
		[userAge],
	);

	const percentileRank = useMemo(() => {
		if (!currentBalance || !ageRow) return null;
		return getPercentileRank(currentBalance, ageRow, gender);
	}, [currentBalance, ageRow, gender]);

	const yourAgeChartData = useMemo(() => {
		if (!ageRow) return [];
		const g = gender;
		const items: { name: string; value: number; color: string }[] = [];

		items.push({
			name: "Median",
			value: g === "male" ? ageRow.male_median : ageRow.female_median,
			color: "#94a3b8",
		});

		const avg =
			g === "male" ? ageRow.male_average : ageRow.female_average;
		if (avg != null) {
			items.push({ name: "Average", value: avg, color: "#64748b" });
		}

		items.push({
			name: "75th",
			value: g === "male" ? ageRow.male_p75 : ageRow.female_p75,
			color: "#60a5fa",
		});
		items.push({
			name: "90th",
			value: g === "male" ? ageRow.male_p90 : ageRow.female_p90,
			color: "#818cf8",
		});

		if (currentBalance) {
			items.push({
				name: "You",
				value: currentBalance,
				color: "#22c55e",
			});
		}

		return items;
	}, [ageRow, gender, currentBalance]);

	const allAgesChartData = useMemo(() => {
		return AU_BENCHMARK_DATA.map((row) => ({
			name: row.age_group,
			median: gender === "male" ? row.male_median : row.female_median,
			p75: gender === "male" ? row.male_p75 : row.female_p75,
			p90: gender === "male" ? row.male_p90 : row.female_p90,
		}));
	}, [gender]);

	return (
		<Card>
			<CardContent className="p-5 space-y-4">
				<div className="flex items-start justify-between gap-3">
					<div>
						<h3 className="text-sm font-semibold text-foreground">
							AU Super Benchmark{ageRow ? ` — Age ${ageRow.age_group}` : ""}
						</h3>
						<p className="mt-0.5 text-xs text-muted-foreground">
							How your balance compares to Australian averages
						</p>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						<div className="flex items-center gap-1.5">
							<label htmlFor="bench-age" className="text-xs text-muted-foreground whitespace-nowrap">
								Age
							</label>
							<input
								id="bench-age"
								type="number"
								min={18}
								max={100}
								placeholder="—"
								value={userAge ?? ""}
								onChange={(e) => handleAgeChange(e.target.value)}
								className="h-7 w-14 rounded-md border border-input bg-transparent px-2 text-xs text-center tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							/>
						</div>
						<div className="flex gap-0.5">
							{GENDER_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => setGender(opt.value)}
									className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
										gender === opt.value
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground hover:text-foreground"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>
				</div>

				{!ageRow && (
					<div className="flex items-center justify-center rounded-lg border border-dashed py-8">
						<p className="text-sm text-muted-foreground">
							Enter your age above to see benchmark comparisons.
						</p>
					</div>
				)}

				{!ageRow && <AllAgesChart data={allAgesChartData} currentBalance={currentBalance} userAgeGroup={null} />}

				{ageRow && <>
				{/* Percentile rank badge */}
				{percentileRank && currentBalance && ageRow && (
					<div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
						<div
							className={`flex size-10 items-center justify-center rounded-full text-xs font-bold text-white ${
								percentileRank === "Top 10%"
									? "bg-purple-500"
									: percentileRank === "Top 25%"
										? "bg-blue-500"
										: percentileRank === "Above median"
											? "bg-green-500"
											: "bg-amber-500"
							}`}
						>
							{percentileRank === "Top 10%"
								? "P90"
								: percentileRank === "Top 25%"
									? "P75"
									: percentileRank === "Above median"
										? "P50"
										: "<P50"}
						</div>
						<div>
							<p className="text-sm font-medium text-foreground">
								{percentileRank}
							</p>
							<p className="text-xs text-muted-foreground">
								{fmtCurrency(currentBalance)} vs{" "}
								{fmtCurrency(
									gender === "male"
										? ageRow.male_median
										: ageRow.female_median,
								)}{" "}
								median (
								{pctDiff(
									currentBalance,
									gender === "male"
										? ageRow.male_median
										: ageRow.female_median,
								)}
								)
							</p>
						</div>
					</div>
				)}

				{/* View toggle */}
				<div className="flex gap-1.5">
					<button
						type="button"
						onClick={() => setViewMode("your-age")}
						className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
							viewMode === "your-age"
								? "bg-foreground text-background"
								: "bg-muted text-muted-foreground hover:text-foreground"
						}`}
					>
						Your Age Group
					</button>
					<button
						type="button"
						onClick={() => setViewMode("all-ages")}
						className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
							viewMode === "all-ages"
								? "bg-foreground text-background"
								: "bg-muted text-muted-foreground hover:text-foreground"
						}`}
					>
						All Age Groups
					</button>
				</div>

				{/* Chart */}
				{viewMode === "your-age" ? (
					<YourAgeChart data={yourAgeChartData} />
				) : (
					<AllAgesChart
						data={allAgesChartData}
						currentBalance={currentBalance}
						userAgeGroup={ageRow?.age_group ?? null}
					/>
				)}

				{/* Comparison cards like the Python app */}
				<ComparisonCards
					row={ageRow}
					gender={gender}
					balance={currentBalance}
				/>

				<p className="text-[10px] text-muted-foreground">
					Source: {ageRow.source}. Balances are for
					individuals aged {ageRow.age_group}. Data may not reflect current values.
				</p>
				</>}
			</CardContent>
		</Card>
	);
}

function YourAgeChart({
	data,
}: { data: { name: string; value: number; color: string }[] }) {
	if (data.length === 0) return null;

	return (
		<div className="h-[220px]">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
					margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
				>
					<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
					<XAxis
						dataKey="name"
						tick={{ fontSize: 11 }}
						className="fill-muted-foreground"
					/>
					<YAxis
						tickFormatter={(v: number) =>
							`$${(v / 1000).toFixed(0)}k`
						}
						tick={{ fontSize: 11 }}
						className="fill-muted-foreground"
						width={60}
					/>
					<Tooltip
						formatter={(value) => [fmtCurrency(Number(value)), "Balance"]}
						contentStyle={{
							backgroundColor: "hsl(var(--popover))",
							borderColor: "hsl(var(--border))",
							borderRadius: "0.5rem",
							fontSize: "0.75rem",
						}}
					/>
					<Bar dataKey="value" radius={[4, 4, 0, 0]}>
						{data.map((entry) => (
							<Cell key={entry.name} fill={entry.color} />
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

function AllAgesChart({
	data,
	currentBalance,
}: {
	data: { name: string; median: number; p75: number; p90: number }[];
	currentBalance: number | null;
	userAgeGroup?: string | null;
}) {
	return (
		<div className="h-[280px]">
			<ResponsiveContainer width="100%" height="100%">
				<BarChart
					data={data}
					margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
				>
					<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
					<XAxis
						dataKey="name"
						tick={{ fontSize: 10 }}
						className="fill-muted-foreground"
						interval={0}
						angle={-30}
						textAnchor="end"
						height={50}
					/>
					<YAxis
						tickFormatter={(v: number) =>
							v >= 1_000_000
								? `$${(v / 1_000_000).toFixed(1)}M`
								: `$${(v / 1000).toFixed(0)}k`
						}
						tick={{ fontSize: 11 }}
						className="fill-muted-foreground"
						width={60}
					/>
					<Tooltip
						formatter={(value, name) => {
							const label =
								name === "median"
									? "Median"
									: name === "p75"
										? "75th Percentile"
										: "90th Percentile";
							return [fmtCurrency(Number(value)), label];
						}}
						contentStyle={{
							backgroundColor: "hsl(var(--popover))",
							borderColor: "hsl(var(--border))",
							borderRadius: "0.5rem",
							fontSize: "0.75rem",
						}}
					/>
					<Bar
						dataKey="median"
						name="Median"
						fill="#94a3b8"
						radius={[2, 2, 0, 0]}
					/>
					<Bar
						dataKey="p75"
						name="75th"
						fill="#60a5fa"
						radius={[2, 2, 0, 0]}
					/>
					<Bar
						dataKey="p90"
						name="90th"
						fill="#818cf8"
						radius={[2, 2, 0, 0]}
					/>
					{currentBalance && (
						<ReferenceLine
							y={currentBalance}
							stroke="#22c55e"
							strokeWidth={2}
							strokeDasharray="6 3"
							label={{
								value: `You: ${fmtCurrency(currentBalance)}`,
								position: "right",
								fill: "#22c55e",
								fontSize: 11,
							}}
						/>
					)}
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

function ComparisonCards({
	row,
	gender,
	balance,
}: {
	row: AuBenchmarkRow;
	gender: Gender;
	balance: number | null;
}) {
	const g = gender;
	const gLabel = `${gender === "male" ? "Male" : "Female"} ${row.age_group}`;

	const metrics: { label: string; sublabel: string; value: number }[] = [];

	metrics.push({
		label: "Median",
		sublabel: gLabel,
		value: g === "male" ? row.male_median : row.female_median,
	});

	const avg = g === "male" ? row.male_average : row.female_average;
	if (avg != null) {
		metrics.push({ label: "Average", sublabel: gLabel, value: avg });
	}

	metrics.push({
		label: "75th Percentile",
		sublabel: gLabel,
		value: g === "male" ? row.male_p75 : row.female_p75,
	});
	metrics.push({
		label: "90th Percentile",
		sublabel: gLabel,
		value: g === "male" ? row.male_p90 : row.female_p90,
	});

	return (
		<div>
			<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
				How You Compare to Other Australians
			</h4>
			<div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
				{balance != null && (
					<div className="rounded-lg border bg-green-500/5 border-green-500/20 p-3">
						<p className="text-[11px] text-muted-foreground">Your Balance</p>
						<p className="mt-1 text-lg font-bold text-foreground tabular-nums">
							{fmtCurrency(balance)}
						</p>
					</div>
				)}
				{metrics.map((m) => {
					const diff = balance != null ? balance - m.value : null;
					const isAbove = diff != null && diff >= 0;
					return (
						<div key={m.label} className="rounded-lg border p-3">
							<p className="text-[11px] text-muted-foreground truncate" title={`${m.label} (${m.sublabel})`}>
								{m.label} ({m.sublabel})
							</p>
							<p className="mt-1 text-lg font-bold text-foreground tabular-nums">
								{fmtCurrency(m.value)}
							</p>
							{diff != null && (
								<p className={`mt-0.5 text-[11px] font-medium ${isAbove ? "text-green-600" : "text-red-500"}`}>
									{isAbove ? "↑" : "↓"} You&apos;re {fmtCurrency(Math.abs(diff))} {isAbove ? "above" : "below"}
								</p>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
