import { Card, CardContent, CardHeader, CardTitle } from "@khufushome/ui";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
	AlertTriangle,
	ArrowDownRight,
	ArrowUpRight,
	Briefcase,
	Calculator,
	CreditCard,
	Landmark,
	LineChart,
	PiggyBank,
	TrendingDown,
	TrendingUp,
	Wallet,
} from "lucide-react";

export const Route = createFileRoute("/")({
	component: HomePage,
});

const netWorth = {
	total: null as number | null,
	change: null as number | null,
	changePct: null as number | null,
};

const breakdown = [
	{ label: "Cash", value: 0, color: "bg-emerald-500" },
	{ label: "Investments", value: 0, color: "bg-blue-500" },
	{ label: "Super", value: 0, color: "bg-violet-500" },
	{ label: "Property", value: 0, color: "bg-amber-500" },
	{ label: "Loans", value: 0, color: "bg-rose-500", negative: true },
];

const sections = [
	{
		to: "/accounts",
		label: "Accounts",
		icon: Wallet,
		metric: "No accounts yet",
		color: "from-emerald-500/10 to-emerald-500/5",
		iconColor: "text-emerald-600 dark:text-emerald-400",
	},
	{
		to: "/transactions",
		label: "Transactions",
		icon: CreditCard,
		metric: "No transactions yet",
		color: "from-sky-500/10 to-sky-500/5",
		iconColor: "text-sky-600 dark:text-sky-400",
	},
	{
		to: "/loans",
		label: "Loans",
		icon: Landmark,
		metric: "No loans tracked",
		color: "from-rose-500/10 to-rose-500/5",
		iconColor: "text-rose-600 dark:text-rose-400",
	},
	{
		to: "/portfolio",
		label: "Portfolio",
		icon: LineChart,
		metric: "No holdings yet",
		color: "from-blue-500/10 to-blue-500/5",
		iconColor: "text-blue-600 dark:text-blue-400",
	},
	{
		to: "/super",
		label: "Superannuation",
		icon: PiggyBank,
		metric: "No super tracked",
		color: "from-violet-500/10 to-violet-500/5",
		iconColor: "text-violet-600 dark:text-violet-400",
	},
	{
		to: "/budget",
		label: "Budget",
		icon: Briefcase,
		metric: "No budget set",
		color: "from-amber-500/10 to-amber-500/5",
		iconColor: "text-amber-600 dark:text-amber-400",
	},
	{
		to: "/tax",
		label: "Tax",
		icon: Calculator,
		metric: "No tax year added",
		color: "from-teal-500/10 to-teal-500/5",
		iconColor: "text-teal-600 dark:text-teal-400",
	},
] as const;

const cashFlow = {
	income: null as number | null,
	expenses: null as number | null,
};

const alerts: { message: string; severity: "warning" | "info" }[] = [];

function formatCurrency(value: number | null): string {
	if (value === null) return "—";
	return new Intl.NumberFormat("en-AU", {
		style: "currency",
		currency: "AUD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

function NetWorthCard() {
	const hasData = netWorth.total !== null;
	const isPositive = (netWorth.change ?? 0) >= 0;

	return (
		<Card className="border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-card dark:from-brand-950/30">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					Total Net Worth
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="font-mono text-4xl font-bold tracking-tight text-foreground">
					{hasData ? formatCurrency(netWorth.total) : "—"}
				</p>
				{hasData && netWorth.change !== null ? (
					<div className="mt-2 flex items-center gap-1.5">
						{isPositive ? (
							<ArrowUpRight className="size-4 text-emerald-600 dark:text-emerald-400" />
						) : (
							<ArrowDownRight className="size-4 text-rose-600 dark:text-rose-400" />
						)}
						<span
							className={`text-sm font-medium ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
						>
							{formatCurrency(Math.abs(netWorth.change))} (
							{netWorth.changePct?.toFixed(1)}%)
						</span>
						<span className="text-xs text-muted-foreground">vs last month</span>
					</div>
				) : (
					<p className="mt-2 text-sm text-muted-foreground">
						Add accounts and assets to see your net worth
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function BreakdownBar() {
	const totalPositive = breakdown
		.filter((b) => !b.negative)
		.reduce((sum, b) => sum + b.value, 0);
	const totalNegative = breakdown
		.filter((b) => b.negative)
		.reduce((sum, b) => sum + b.value, 0);
	const total = totalPositive + totalNegative;

	if (total === 0) {
		return (
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm font-medium text-muted-foreground">
						Net Worth Breakdown
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="h-4 w-full rounded-full bg-muted" />
					<p className="mt-3 text-sm text-muted-foreground">
						No data yet — add accounts, investments, and loans to see your
						breakdown.
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					Net Worth Breakdown
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex h-4 w-full overflow-hidden rounded-full">
					{breakdown.map((item) =>
						item.value > 0 ? (
							<div
								key={item.label}
								className={`${item.color} transition-all`}
								style={{ width: `${(item.value / total) * 100}%` }}
								title={`${item.label}: ${formatCurrency(item.value)}`}
							/>
						) : null,
					)}
				</div>
				<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
					{breakdown.map((item) => (
						<div key={item.label} className="flex items-center gap-1.5">
							<div className={`size-2.5 rounded-full ${item.color}`} />
							<span className="text-xs text-muted-foreground">
								{item.label}
							</span>
							<span className="text-xs font-medium text-foreground">
								{formatCurrency(item.value)}
							</span>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function SectionNavCards() {
	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{sections.map((section) => (
				<Link
					key={section.to}
					to={section.to}
					className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700"
				>
					<div className="flex items-start justify-between">
						<div
							className={`flex size-10 items-center justify-center rounded-lg bg-gradient-to-br ${section.color}`}
						>
							<section.icon className={`size-5 ${section.iconColor}`} />
						</div>
						<ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
					</div>
					<p className="mt-3 text-sm font-semibold text-foreground">
						{section.label}
					</p>
					<p className="mt-0.5 text-xs text-muted-foreground">
						{section.metric}
					</p>
				</Link>
			))}
		</div>
	);
}

function CashFlowSummary() {
	const hasData = cashFlow.income !== null || cashFlow.expenses !== null;
	const income = cashFlow.income ?? 0;
	const expenses = cashFlow.expenses ?? 0;
	const net = income - expenses;
	const now = new Date();
	const monthName = now.toLocaleString("en-AU", { month: "long", year: "numeric" });

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					Monthly Cash Flow — {monthName}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{hasData ? (
					<div className="grid grid-cols-3 gap-4">
						<div>
							<div className="flex items-center gap-1.5">
								<TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
								<span className="text-xs text-muted-foreground">Income</span>
							</div>
							<p className="mt-1 font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
								{formatCurrency(income)}
							</p>
						</div>
						<div>
							<div className="flex items-center gap-1.5">
								<TrendingDown className="size-4 text-rose-600 dark:text-rose-400" />
								<span className="text-xs text-muted-foreground">Expenses</span>
							</div>
							<p className="mt-1 font-mono text-lg font-bold text-rose-600 dark:text-rose-400">
								{formatCurrency(expenses)}
							</p>
						</div>
						<div>
							<div className="flex items-center gap-1.5">
								{net >= 0 ? (
									<ArrowUpRight className="size-4 text-emerald-600 dark:text-emerald-400" />
								) : (
									<ArrowDownRight className="size-4 text-rose-600 dark:text-rose-400" />
								)}
								<span className="text-xs text-muted-foreground">Net</span>
							</div>
							<p
								className={`mt-1 font-mono text-lg font-bold ${net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
							>
								{formatCurrency(net)}
							</p>
						</div>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">
						Import transactions to see your monthly cash flow.
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function AlertsSection() {
	if (alerts.length === 0) return null;

	return (
		<Card className="border-amber-200 dark:border-amber-800/50">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
					<AlertTriangle className="size-4 text-amber-500" />
					Alerts
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-2">
					{alerts.map((alert) => (
						<li
							key={alert.message}
							className={`flex items-start gap-2 text-sm ${
								alert.severity === "warning"
									? "text-amber-700 dark:text-amber-400"
									: "text-muted-foreground"
							}`}
						>
							<span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-current" />
							{alert.message}
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}

function HomePage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-display text-2xl font-bold text-foreground">
					Finance Home
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Your complete financial picture at a glance.
				</p>
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<NetWorthCard />
				<BreakdownBar />
			</div>

			<CashFlowSummary />

			<div>
				<h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					Sections
				</h2>
				<SectionNavCards />
			</div>

			<AlertsSection />
		</div>
	);
}
