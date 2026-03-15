import { Badge, Button, Card, CardContent } from "@khufushome/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertCircle, CalendarDays, DollarSign, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AuBenchmarkCard } from "../../../components/super/AuBenchmarkCard";
import { ContributionFormDialog } from "../../../components/super/ContributionFormDialog";
import { YourSuperBadge } from "../../../components/super/YourSuperBadge";
import { SnapshotFormDialog } from "../../../components/super/SnapshotFormDialog";
import { SuperNav } from "../../../components/super/SuperNav";
import {
	createContribution,
	createSnapshot,
	deleteContribution,
	deleteSnapshot,
	fetchContributions,
	fetchSnapshots,
	fetchSuperAccounts,
	updateContribution,
	updateSnapshot,
} from "../../../lib/super-api";
import type {
	BalanceSnapshot,
	BalanceSnapshotInsert,
	BalanceSnapshotUpdate,
	Contribution,
	ContributionInsert,
	ContributionUpdate,
} from "../../../lib/super-types";
import {
	CONCESSIONAL_TYPES,
	CONTRIBUTION_TYPE_LABELS,
} from "../../../lib/super-types";

export const Route = createFileRoute("/super/analysis/")({
	component: SuperAnalysisOverviewPage,
});

function fmtCurrency(n: number | null | undefined): string {
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

function deriveInvestmentReturn(
	snapshot: BalanceSnapshotInsert,
	prevBalance: number | null,
): number | null {
	if (prevBalance == null) return null;
	const employer = snapshot.employer_contribution ?? 0;
	const salSac = snapshot.salary_sacrifice ?? 0;
	const fee = snapshot.member_fee ?? 0;
	const tax = snapshot.income_tax ?? 0;
	const insurance = snapshot.insurance_premium ?? 0;
	return snapshot.balance - prevBalance - employer - salSac + fee + tax + insurance;
}

function SuperAnalysisOverviewPage() {
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingSnapshot, setEditingSnapshot] =
		useState<BalanceSnapshot | null>(null);

	const { data: accounts = [] } = useQuery({
		queryKey: ["super-accounts"],
		queryFn: fetchSuperAccounts,
	});
	const activeAccount = accounts.find((a) => a.is_active);
	const activeAccountId = activeAccount?.id ?? null;

	const { data: snapshots = [], isLoading } = useQuery({
		queryKey: ["super-snapshots"],
		queryFn: fetchSnapshots,
	});

	const createMut = useMutation({
		mutationFn: (data: BalanceSnapshotInsert) => createSnapshot(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["super-snapshots"] });
			setDialogOpen(false);
		},
	});

	const updateMut = useMutation({
		mutationFn: ({ id, data }: { id: string; data: BalanceSnapshotUpdate }) =>
			updateSnapshot(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["super-snapshots"] });
			setDialogOpen(false);
			setEditingSnapshot(null);
		},
	});

	const deleteMut = useMutation({
		mutationFn: (id: string) => deleteSnapshot(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["super-snapshots"] });
		},
	});

	// ── Contributions ──────────────────────────────────────
	const [contribDialogOpen, setContribDialogOpen] = useState(false);
	const [editingContrib, setEditingContrib] = useState<Contribution | null>(null);

	const { data: contributions = [] } = useQuery({
		queryKey: ["super-contributions", activeAccountId],
		queryFn: () => fetchContributions(activeAccountId ?? undefined),
		enabled: !!activeAccountId,
	});

	const createContribMut = useMutation({
		mutationFn: (data: ContributionInsert) => createContribution(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["super-contributions"] });
			setContribDialogOpen(false);
		},
	});

	const updateContribMut = useMutation({
		mutationFn: ({ id, data }: { id: string; data: ContributionUpdate }) =>
			updateContribution(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["super-contributions"] });
			setContribDialogOpen(false);
			setEditingContrib(null);
		},
	});

	const deleteContribMut = useMutation({
		mutationFn: (id: string) => deleteContribution(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["super-contributions"] });
		},
	});

	const currentFY = useMemo(() => {
		const now = new Date();
		const y = now.getFullYear();
		const m = now.getMonth() + 1;
		return m >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
	}, []);

	const fyContributions = useMemo(
		() => contributions.filter((c) => c.financial_year === currentFY),
		[contributions, currentFY],
	);

	const concessionalTotal = useMemo(
		() =>
			fyContributions
				.filter((c) => CONCESSIONAL_TYPES.includes(c.type))
				.reduce((sum, c) => sum + c.amount, 0),
		[fyContributions],
	);

	const CONCESSIONAL_CAP = 30_000;

	// ── Snapshot helpers ──────────────────────────────────
	const sorted = [...snapshots].sort((a, b) =>
		a.recorded_date.localeCompare(b.recorded_date),
	);
	const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
	const latestSnapshotDate = latest?.recorded_date ?? null;
	const isLatestSnapshot = (s: BalanceSnapshot) =>
		s.id === latest?.id;

	const handleOpenCreate = () => {
		setEditingSnapshot(null);
		setDialogOpen(true);
	};

	const handleOpenEdit = (s: BalanceSnapshot) => {
		setEditingSnapshot(s);
		setDialogOpen(true);
	};

	const handleSubmit = (raw: BalanceSnapshotInsert | BalanceSnapshotUpdate) => {
		const data = raw as BalanceSnapshotInsert;

		if (editingSnapshot) {
			const idx = sorted.findIndex((s) => s.id === editingSnapshot.id);
			const prev = idx > 0 ? (sorted[idx - 1]?.balance ?? null) : null;
			const investmentReturn = deriveInvestmentReturn(data, prev);
			updateMut.mutate({
				id: editingSnapshot.id,
				data: { ...data, investment_return: investmentReturn },
			});
		} else {
			const prev = sorted.length > 0 ? (sorted[sorted.length - 1]?.balance ?? null) : null;
			const investmentReturn = deriveInvestmentReturn(data, prev);
			createMut.mutate({ ...data, investment_return: investmentReturn });
		}
	};

	const handleDelete = (s: BalanceSnapshot) => {
		if (
			window.confirm(
				`Delete snapshot for ${fmtDate(s.recorded_date)}? This cannot be undone.`,
			)
		) {
			deleteMut.mutate(s.id);
		}
	};

	// ── Contribution handlers ──────────────────────────────
	const handleOpenCreateContrib = () => {
		setEditingContrib(null);
		setContribDialogOpen(true);
	};

	const handleOpenEditContrib = (c: Contribution) => {
		setEditingContrib(c);
		setContribDialogOpen(true);
	};

	const handleContribSubmit = (
		data: ContributionInsert | ContributionUpdate,
		id?: string,
	) => {
		if (id) {
			updateContribMut.mutate({ id, data: data as ContributionUpdate });
		} else {
			createContribMut.mutate(data as ContributionInsert);
		}
	};

	const handleDeleteContrib = (c: Contribution) => {
		if (
			window.confirm(
				`Delete ${CONTRIBUTION_TYPE_LABELS[c.type]} contribution of ${fmtCurrency(c.amount)} on ${fmtDate(c.date)}?`,
			)
		) {
			deleteContribMut.mutate(c.id);
		}
	};

	return (
		<div className="space-y-6">
			<SuperNav />
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-display text-2xl font-bold text-foreground">
						Super Analysis — Overview
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Current balance, quarterly snapshots, and contributions summary.
					</p>
				</div>
				<Button size="sm" onClick={handleOpenCreate} disabled={!activeAccountId}>
					<Plus className="mr-1.5 size-4" />
					New Snapshot
				</Button>
			</div>

			{!activeAccountId && (
				<Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
					<CardContent className="flex items-center gap-3 p-4">
						<AlertCircle className="size-5 shrink-0 text-amber-600" />
						<div className="text-sm">
							<p className="font-medium text-foreground">No active super account</p>
							<p className="text-muted-foreground">
								<Link to="/super" className="text-primary hover:underline">
									Add a super fund account
								</Link>{" "}
								to start tracking snapshots.
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			<YourSuperBadge fundId={activeAccount?.metadata?.fund_id} />

			<AuBenchmarkCard currentBalance={latest?.balance ?? null} />

			{latest && (
				<div className="grid gap-4 sm:grid-cols-3">
					<Card>
						<CardContent className="p-5">
							<p className="text-sm text-muted-foreground">Current Balance</p>
							<p className="mt-1 text-2xl font-bold text-foreground">
								{fmtCurrency(latest.balance)}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								as of {fmtDate(latest.recorded_date)}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-5">
							<p className="text-sm text-muted-foreground">
								Last Employer Contribution
							</p>
							<p className="mt-1 text-2xl font-bold text-foreground">
								{fmtCurrency(latest.employer_contribution)}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="p-5">
							<p className="text-sm text-muted-foreground">
								Last Investment Return
							</p>
							<p className="mt-1 text-2xl font-bold text-foreground">
								{fmtCurrency(latest.investment_return)}
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			<Card>
				<CardContent className="p-0">
					<div className="border-b px-5 py-3">
						<h2 className="text-sm font-semibold text-foreground">
							Quarterly Snapshots
						</h2>
					</div>
					{isLoading ? (
						<div className="p-5 space-y-3">
							{Array.from({ length: 3 }, (_, i) => (
								<div
									key={`skel-${i.toString()}`}
									className="h-10 animate-pulse rounded bg-muted"
								/>
							))}
						</div>
					) : snapshots.length === 0 ? (
						<div className="flex flex-col items-center py-12">
							<div className="flex size-14 items-center justify-center rounded-full bg-muted">
								<CalendarDays className="size-7 text-muted-foreground" />
							</div>
							<p className="mt-3 text-sm font-medium text-foreground">
								No snapshots yet
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Add your first quarterly statement to start tracking.
							</p>
							<Button size="sm" className="mt-4" onClick={handleOpenCreate}>
								<Plus className="mr-1.5 size-4" />
								Add Snapshot
							</Button>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left text-muted-foreground">
										<th className="px-5 py-2.5 font-medium">Date</th>
										<th className="px-5 py-2.5 font-medium text-right">
											Balance
										</th>
										<th className="px-5 py-2.5 font-medium text-right">
											Employer
										</th>
										<th className="px-5 py-2.5 font-medium text-right">
											Fee
										</th>
										<th className="px-5 py-2.5 font-medium text-right">
											Tax
										</th>
										<th className="px-5 py-2.5 font-medium text-right">
											Return
										</th>
										<th className="px-5 py-2.5 font-medium text-right w-20">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{snapshots.map((s) => (
										<tr
											key={s.id}
											className="border-b last:border-0 hover:bg-muted/30"
										>
											<td className="px-5 py-2.5 font-medium">
												{fmtDate(s.recorded_date)}
											</td>
											<td className="px-5 py-2.5 text-right">
												{fmtCurrency(s.balance)}
											</td>
											<td className="px-5 py-2.5 text-right">
												{fmtCurrency(s.employer_contribution)}
											</td>
											<td className="px-5 py-2.5 text-right">
												{fmtCurrency(s.member_fee)}
											</td>
											<td className="px-5 py-2.5 text-right">
												{fmtCurrency(s.income_tax)}
											</td>
											<td className="px-5 py-2.5 text-right">
												{fmtCurrency(s.investment_return)}
											</td>
											<td className="px-5 py-2.5 text-right">
												<div className="flex justify-end gap-1">
													<Button
														variant="ghost"
														size="sm"
														className="size-7 p-0"
														onClick={() => handleOpenEdit(s)}
														title="Edit"
													>
														<Pencil className="size-3.5" />
													</Button>
													{isLatestSnapshot(s) && (
														<Button
															variant="ghost"
															size="sm"
															className="size-7 p-0 text-destructive hover:text-destructive"
															onClick={() => handleDelete(s)}
															title="Delete"
														>
															<Trash2 className="size-3.5" />
														</Button>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* ── Contributions Section ────────────────────────── */}
			{activeAccountId && (
				<>
					<div className="grid gap-4 sm:grid-cols-2">
						<Card>
							<CardContent className="p-5">
								<p className="text-sm text-muted-foreground">
									FY {currentFY} — Total Contributions
								</p>
								<p className="mt-1 text-2xl font-bold text-foreground">
									{fmtCurrency(
										fyContributions.reduce((s, c) => s + c.amount, 0),
									)}
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									{fyContributions.length} record{fyContributions.length !== 1 ? "s" : ""} this FY
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-5">
								<p className="text-sm text-muted-foreground">
									Concessional Cap ({currentFY})
								</p>
								<p className="mt-1 text-2xl font-bold text-foreground">
									{fmtCurrency(concessionalTotal)}{" "}
									<span className="text-sm font-normal text-muted-foreground">
										/ {fmtCurrency(CONCESSIONAL_CAP)}
									</span>
								</p>
								<div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
									<div
										className={`h-full rounded-full transition-all ${
											concessionalTotal / CONCESSIONAL_CAP > 0.9
												? "bg-red-500"
												: concessionalTotal / CONCESSIONAL_CAP > 0.7
													? "bg-amber-500"
													: "bg-green-500"
										}`}
										style={{
											width: `${Math.min(100, (concessionalTotal / CONCESSIONAL_CAP) * 100)}%`,
										}}
									/>
								</div>
								<p className="mt-1 text-xs text-muted-foreground">
									{fmtCurrency(Math.max(0, CONCESSIONAL_CAP - concessionalTotal))} remaining
								</p>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardContent className="p-0">
							<div className="flex items-center justify-between border-b px-5 py-3">
								<h2 className="text-sm font-semibold text-foreground">
									Contribution Records
								</h2>
								<Button size="sm" variant="outline" onClick={handleOpenCreateContrib}>
									<Plus className="mr-1.5 size-3.5" />
									Add
								</Button>
							</div>
							{contributions.length === 0 ? (
								<div className="flex flex-col items-center py-12">
									<div className="flex size-14 items-center justify-center rounded-full bg-muted">
										<DollarSign className="size-7 text-muted-foreground" />
									</div>
									<p className="mt-3 text-sm font-medium text-foreground">
										No contributions recorded
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										Record employer SG, salary sacrifice, or personal contributions.
									</p>
									<Button
										size="sm"
										className="mt-4"
										onClick={handleOpenCreateContrib}
									>
										<Plus className="mr-1.5 size-4" />
										Add Contribution
									</Button>
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b text-left text-muted-foreground">
												<th className="px-5 py-2.5 font-medium">Date</th>
												<th className="px-5 py-2.5 font-medium">Type</th>
												<th className="px-5 py-2.5 font-medium text-right">
													Amount
												</th>
												<th className="px-5 py-2.5 font-medium">FY</th>
												<th className="px-5 py-2.5 font-medium">Notes</th>
												<th className="px-5 py-2.5 font-medium text-right w-20">
													Actions
												</th>
											</tr>
										</thead>
										<tbody>
											{contributions.map((c) => (
												<tr
													key={c.id}
													className="border-b last:border-0 hover:bg-muted/30"
												>
													<td className="px-5 py-2.5 font-medium whitespace-nowrap">
														{fmtDate(c.date)}
													</td>
													<td className="px-5 py-2.5">
														<Badge
															variant={
																CONCESSIONAL_TYPES.includes(c.type)
																	? "default"
																	: "secondary"
															}
															className="text-[10px]"
														>
															{CONTRIBUTION_TYPE_LABELS[c.type]}
														</Badge>
													</td>
													<td className="px-5 py-2.5 text-right tabular-nums">
														{fmtCurrency(c.amount)}
													</td>
													<td className="px-5 py-2.5 text-muted-foreground text-xs">
														{c.financial_year}
													</td>
													<td className="px-5 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">
														{c.employer_name || c.notes || "—"}
													</td>
													<td className="px-5 py-2.5 text-right">
														<div className="flex justify-end gap-1">
															<Button
																variant="ghost"
																size="sm"
																className="size-7 p-0"
																onClick={() => handleOpenEditContrib(c)}
																title="Edit"
															>
																<Pencil className="size-3.5" />
															</Button>
															<Button
																variant="ghost"
																size="sm"
																className="size-7 p-0 text-destructive hover:text-destructive"
																onClick={() => handleDeleteContrib(c)}
																title="Delete"
															>
																<Trash2 className="size-3.5" />
															</Button>
														</div>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}

			<SnapshotFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				snapshot={editingSnapshot}
				superAccountId={activeAccountId ?? ""}
				latestSnapshotDate={latestSnapshotDate}
				onSubmit={handleSubmit}
				isPending={createMut.isPending || updateMut.isPending}
			/>

			<ContributionFormDialog
				open={contribDialogOpen}
				onOpenChange={setContribDialogOpen}
				contribution={editingContrib}
				superAccountId={activeAccountId ?? ""}
				onSubmit={handleContribSubmit}
				isPending={createContribMut.isPending || updateContribMut.isPending}
			/>
		</div>
	);
}
