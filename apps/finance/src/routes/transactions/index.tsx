import {
	Badge,
	Button,
	Card,
	CardContent,
	Input,
} from "@khufushome/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	ArrowDownRight,
	ArrowRightLeft,
	ArrowUpRight,
	ChevronLeft,
	ChevronRight,
	Pencil,
	Plus,
	Search,
	Trash2,
	Upload,
} from "lucide-react";
import { useState } from "react";
import { CsvImportDialog } from "../../components/transactions/CsvImportDialog";
import { TransactionFormDialog } from "../../components/transactions/TransactionFormDialog";
import { fetchAccounts } from "../../lib/accounts-api";
import {
	type TransactionFilters,
	createTransaction,
	deleteTransaction,
	fetchTransactions,
	updateTransaction,
} from "../../lib/transactions-api";
import {
	TRANSACTION_TYPES,
	TRANSACTION_TYPE_LABELS,
	type Transaction,
	type TransactionInsert,
	type TransactionUpdate,
} from "../../lib/types";

export const Route = createFileRoute("/transactions/")({
	component: TransactionsPage,
});

const PAGE_SIZE = 25;

function typeIcon(type: string) {
	if (type === "income") return <ArrowUpRight className="size-4 text-green-500" />;
	if (type === "expense") return <ArrowDownRight className="size-4 text-red-500" />;
	return <ArrowRightLeft className="size-4 text-blue-500" />;
}

function typeColor(type: string) {
	if (type === "income") return "text-green-600 dark:text-green-400";
	if (type === "expense") return "text-red-600 dark:text-red-400";
	return "text-blue-600 dark:text-blue-400";
}

function TransactionsPage() {
	const queryClient = useQueryClient();

	const [page, setPage] = useState(0);
	const [search, setSearch] = useState("");
	const [filterType, setFilterType] = useState("");
	const [filterAccount, setFilterAccount] = useState("");
	const [filterDateFrom, setFilterDateFrom] = useState("");
	const [filterDateTo, setFilterDateTo] = useState("");

	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
	const [importOpen, setImportOpen] = useState(false);

	const filters: TransactionFilters = {
		...(filterType && { type: filterType }),
		...(filterAccount && { accountId: filterAccount }),
		...(filterDateFrom && { dateFrom: filterDateFrom }),
		...(filterDateTo && { dateTo: filterDateTo }),
		...(search.trim() && { search: search.trim() }),
	};

	const { data: accounts } = useQuery({
		queryKey: ["accounts"],
		queryFn: () => fetchAccounts(true),
	});

	const {
		data: result,
		isLoading,
	} = useQuery({
		queryKey: ["transactions", filters, page],
		queryFn: () => fetchTransactions(filters, PAGE_SIZE, page * PAGE_SIZE),
	});

	const transactions = result?.data ?? [];
	const totalCount = result?.count ?? 0;
	const totalPages = Math.ceil(totalCount / PAGE_SIZE);

	const accountMap = new Map(accounts?.map((a) => [a.id, a.name]) ?? []);

	const createMut = useMutation({
		mutationFn: (data: TransactionInsert) => createTransaction(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			setDialogOpen(false);
		},
	});

	const updateMut = useMutation({
		mutationFn: ({ id, data }: { id: string; data: TransactionUpdate }) =>
			updateTransaction(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			setDialogOpen(false);
			setEditingTxn(null);
		},
	});

	const deleteMut = useMutation({
		mutationFn: (id: string) => deleteTransaction(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
	});

	const handleSubmit = (data: TransactionInsert | TransactionUpdate) => {
		if (editingTxn) {
			updateMut.mutate({ id: editingTxn.id, data });
		} else {
			createMut.mutate(data as TransactionInsert);
		}
	};

	const handleEdit = (txn: Transaction) => {
		setEditingTxn(txn);
		setDialogOpen(true);
	};

	const handleDelete = (txn: Transaction) => {
		if (window.confirm(`Delete this ${txn.type} of $${Math.abs(txn.amount).toFixed(2)}?`)) {
			deleteMut.mutate(txn.id);
		}
	};

	const handleNew = () => {
		setEditingTxn(null);
		setDialogOpen(true);
	};

	const clearFilters = () => {
		setSearch("");
		setFilterType("");
		setFilterAccount("");
		setFilterDateFrom("");
		setFilterDateTo("");
		setPage(0);
	};

	const hasActiveFilters =
		search || filterType || filterAccount || filterDateFrom || filterDateTo;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-display text-2xl font-bold text-foreground">
						Transactions
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{totalCount.toLocaleString()} transaction{totalCount !== 1 ? "s" : ""}
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => setImportOpen(true)}>
						<Upload className="mr-1.5 size-4" />
						Import CSV
					</Button>
					<Button onClick={handleNew}>
						<Plus className="mr-1.5 size-4" />
						Add Transaction
					</Button>
				</div>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-wrap items-end gap-3">
						<div className="relative flex-1 min-w-[200px]">
							<Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
									setPage(0);
								}}
								placeholder="Search description, category, notes…"
								className="pl-9"
							/>
						</div>
						<div className="min-w-[130px]">
							<select
								value={filterType}
								onChange={(e) => {
									setFilterType(e.target.value);
									setPage(0);
								}}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								<option value="">All types</option>
								{TRANSACTION_TYPES.map((t) => (
									<option key={t} value={t}>
										{TRANSACTION_TYPE_LABELS[t]}
									</option>
								))}
							</select>
						</div>
						<div className="min-w-[160px]">
							<select
								value={filterAccount}
								onChange={(e) => {
									setFilterAccount(e.target.value);
									setPage(0);
								}}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								<option value="">All accounts</option>
								{accounts?.map((a) => (
									<option key={a.id} value={a.id}>
										{a.name}
									</option>
								))}
							</select>
						</div>
						<div>
							<Input
								type="date"
								value={filterDateFrom}
								onChange={(e) => {
									setFilterDateFrom(e.target.value);
									setPage(0);
								}}
								className="w-[140px]"
								placeholder="From"
							/>
						</div>
						<div>
							<Input
								type="date"
								value={filterDateTo}
								onChange={(e) => {
									setFilterDateTo(e.target.value);
									setPage(0);
								}}
								className="w-[140px]"
								placeholder="To"
							/>
						</div>
						{hasActiveFilters && (
							<Button variant="ghost" size="sm" onClick={clearFilters}>
								Clear
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Table */}
			<Card>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="p-8 text-center text-sm text-muted-foreground">
							Loading transactions…
						</div>
					) : transactions.length === 0 ? (
						<div className="flex flex-col items-center py-16 px-4">
							<p className="text-lg font-semibold text-foreground">
								{hasActiveFilters ? "No matching transactions" : "No transactions yet"}
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								{hasActiveFilters
									? "Try adjusting your filters."
									: "Add your first transaction to get started."}
							</p>
							{!hasActiveFilters && (
								<Button className="mt-4" onClick={handleNew}>
									<Plus className="mr-1.5 size-4" />
									Add Transaction
								</Button>
							)}
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b bg-muted/30">
										<th className="px-4 py-3 text-left font-medium text-muted-foreground">
											Date
										</th>
										<th className="px-4 py-3 text-left font-medium text-muted-foreground">
											Type
										</th>
										<th className="px-4 py-3 text-left font-medium text-muted-foreground">
											Category
										</th>
										<th className="px-4 py-3 text-left font-medium text-muted-foreground">
											Description
										</th>
										<th className="px-4 py-3 text-left font-medium text-muted-foreground">
											Account
										</th>
										<th className="px-4 py-3 text-right font-medium text-muted-foreground">
											Amount
										</th>
										<th className="px-4 py-3 text-right font-medium text-muted-foreground">
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{transactions.map((txn) => (
										<tr
											key={txn.id}
											className="border-b border-border/50 hover:bg-muted/20 transition-colors"
										>
											<td className="px-4 py-3 whitespace-nowrap text-foreground">
												{new Date(txn.date).toLocaleDateString("en-AU", {
													day: "numeric",
													month: "short",
													year: "numeric",
												})}
											</td>
											<td className="px-4 py-3">
												<div className="flex items-center gap-1.5">
													{typeIcon(txn.type)}
													<span className="text-xs font-medium capitalize">
														{txn.type}
													</span>
												</div>
											</td>
											<td className="px-4 py-3">
												<Badge variant="outline" className="text-xs font-normal">
													{txn.category}
												</Badge>
												{txn.subcategory && (
													<span className="ml-1 text-xs text-muted-foreground">
														/ {txn.subcategory}
													</span>
												)}
											</td>
											<td className="px-4 py-3 max-w-[250px] truncate text-foreground">
												{txn.description || "—"}
												{txn.tags.length > 0 && (
													<div className="flex gap-1 mt-0.5">
														{txn.tags.map((tag) => (
															<Badge
																key={tag}
																variant="secondary"
																className="text-[10px] px-1 py-0"
															>
																{tag}
															</Badge>
														))}
													</div>
												)}
											</td>
											<td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
												{accountMap.get(txn.account_id) ?? "Unknown"}
											</td>
											<td
												className={`px-4 py-3 text-right font-mono font-medium whitespace-nowrap ${typeColor(txn.type)}`}
											>
												{txn.type === "income" ? "+" : txn.type === "expense" ? "−" : ""}
												${Math.abs(txn.amount).toLocaleString("en-AU", {
													minimumFractionDigits: 2,
													maximumFractionDigits: 2,
												})}
											</td>
											<td className="px-4 py-3 text-right">
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="ghost"
														size="sm"
														className="h-7 w-7 p-0"
														onClick={() => handleEdit(txn)}
													>
														<Pencil className="size-3.5" />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														className="h-7 w-7 p-0 text-destructive hover:text-destructive"
														onClick={() => handleDelete(txn)}
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

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="flex items-center justify-between border-t px-4 py-3">
							<span className="text-xs text-muted-foreground">
								Page {page + 1} of {totalPages} ({totalCount.toLocaleString()} total)
							</span>
							<div className="flex gap-1">
								<Button
									variant="outline"
									size="sm"
									disabled={page === 0}
									onClick={() => setPage((p) => p - 1)}
								>
									<ChevronLeft className="size-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={page >= totalPages - 1}
									onClick={() => setPage((p) => p + 1)}
								>
									<ChevronRight className="size-4" />
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<TransactionFormDialog
				open={dialogOpen}
				onOpenChange={(o) => {
					setDialogOpen(o);
					if (!o) setEditingTxn(null);
				}}
				transaction={editingTxn}
				onSubmit={handleSubmit}
				isPending={createMut.isPending || updateMut.isPending}
			/>

			<CsvImportDialog
				open={importOpen}
				onOpenChange={setImportOpen}
			/>
		</div>
	);
}
