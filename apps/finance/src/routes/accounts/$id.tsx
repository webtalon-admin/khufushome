import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@khufushome/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Archive,
	ArchiveRestore,
	ArrowDownRight,
	ArrowLeft,
	ArrowRightLeft,
	ArrowUpRight,
	Pencil,
	Plus,
	Trash2,
	Upload,
} from "lucide-react";
import { useState } from "react";
import { AccountFormDialog } from "../../components/accounts/AccountFormDialog";
import { CsvImportDialog } from "../../components/transactions/CsvImportDialog";
import { TransactionFormDialog } from "../../components/transactions/TransactionFormDialog";
import {
	archiveAccount,
	deleteAccount,
	fetchAccount,
	restoreAccount,
	updateAccount,
} from "../../lib/accounts-api";
import {
	createTransaction,
	deleteTransaction,
	fetchTransactions,
	updateTransaction,
} from "../../lib/transactions-api";
import {
	ACCOUNT_TYPE_LABELS,
	type AccountUpdate,
	type Transaction,
	type TransactionInsert,
	type TransactionUpdate,
} from "../../lib/types";

export const Route = createFileRoute("/accounts/$id")({
	component: AccountDetailPage,
});

function txnTypeIcon(type: string) {
	if (type === "income") return <ArrowUpRight className="size-3.5 text-green-500" />;
	if (type === "expense") return <ArrowDownRight className="size-3.5 text-red-500" />;
	return <ArrowRightLeft className="size-3.5 text-blue-500" />;
}

function AccountDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [txnDialogOpen, setTxnDialogOpen] = useState(false);
	const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
	const [csvImportOpen, setCsvImportOpen] = useState(false);

	const {
		data: account,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["accounts", id],
		queryFn: () => fetchAccount(id),
	});

	const updateMutation = useMutation({
		mutationFn: (data: AccountUpdate) => updateAccount(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
			setEditDialogOpen(false);
		},
	});

	const archiveMutation = useMutation({
		mutationFn: () => archiveAccount(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
		},
	});

	const restoreMutation = useMutation({
		mutationFn: () => restoreAccount(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: () => deleteAccount(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
			navigate({ to: "/accounts" });
		},
	});

	const { data: txnResult } = useQuery({
		queryKey: ["transactions", { accountId: id }],
		queryFn: () => fetchTransactions({ accountId: id }, 10),
	});
	const recentTxns = txnResult?.data ?? [];
	const txnCount = txnResult?.count ?? 0;

	const createTxnMut = useMutation({
		mutationFn: (data: TransactionInsert) => createTransaction(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			setTxnDialogOpen(false);
		},
	});

	const updateTxnMut = useMutation({
		mutationFn: ({ tid, data }: { tid: string; data: TransactionUpdate }) =>
			updateTransaction(tid, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
			setTxnDialogOpen(false);
			setEditingTxn(null);
		},
	});

	const deleteTxnMut = useMutation({
		mutationFn: (tid: string) => deleteTransaction(tid),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
	});

	const handleTxnSubmit = (data: TransactionInsert | TransactionUpdate) => {
		if (editingTxn) {
			updateTxnMut.mutate({ tid: editingTxn.id, data });
		} else {
			createTxnMut.mutate(data as TransactionInsert);
		}
	};

	const handleDelete = () => {
		if (
			account &&
			window.confirm(`Delete "${account.name}"? This cannot be undone.`)
		) {
			deleteMutation.mutate();
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="h-8 w-48 animate-pulse rounded bg-muted" />
				<div className="h-4 w-64 animate-pulse rounded bg-muted" />
				<Card>
					<CardContent className="p-6">
						<div className="h-32 animate-pulse rounded bg-muted" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error || !account) {
		return (
			<div className="space-y-4">
				<Link
					to="/accounts"
					className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-4" />
					Back to Accounts
				</Link>
				<Card>
					<CardContent className="flex flex-col items-center py-16">
						<p className="text-lg font-semibold text-foreground">
							Account not found
						</p>
						<p className="mt-1 text-sm text-muted-foreground">
							This account may have been deleted.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const metadata = account.metadata as Record<string, unknown>;
	const metadataEntries = Object.entries(metadata).filter(
		([, v]) => v !== null && v !== undefined && v !== "",
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Link
					to="/accounts"
					className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="size-4" />
					Accounts
				</Link>
			</div>

			<div className="flex items-start justify-between">
				<div>
					<div className="flex items-center gap-3">
						<h1 className="font-display text-2xl font-bold text-foreground">
							{account.name}
						</h1>
						{!account.is_active && (
							<Badge variant="outline" className="text-muted-foreground">
								Archived
							</Badge>
						)}
					</div>
					<div className="mt-1 flex items-center gap-2">
						<Badge variant="secondary">
							{ACCOUNT_TYPE_LABELS[account.type]}
						</Badge>
						{account.institution && (
							<span className="text-sm text-muted-foreground">
								{account.institution}
							</span>
						)}
						<span className="text-sm text-muted-foreground">
							· {account.currency}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setEditDialogOpen(true)}
					>
						<Pencil className="mr-1.5 size-4" />
						Edit
					</Button>
					{account.is_active ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => archiveMutation.mutate()}
						>
							<Archive className="mr-1.5 size-4" />
							Archive
						</Button>
					) : (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={() => restoreMutation.mutate()}
							>
								<ArchiveRestore className="mr-1.5 size-4" />
								Restore
							</Button>
							<Button variant="destructive" size="sm" onClick={handleDelete}>
								<Trash2 className="mr-1.5 size-4" />
								Delete
							</Button>
						</>
					)}
				</div>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between pb-2">
					<CardTitle className="text-sm font-medium text-muted-foreground">
						Recent Transactions {txnCount > 0 && `(${txnCount})`}
					</CardTitle>
					<div className="flex items-center gap-2">
						{txnCount > 10 && (
							<Link
								to="/transactions"
								search={{ accountId: id } as never}
								className="text-xs text-primary hover:underline"
							>
								View all
							</Link>
						)}
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={() => setCsvImportOpen(true)}
						>
							<Upload className="mr-1 size-3" />
							Import
						</Button>
						<Button
							variant="outline"
							size="sm"
							className="h-7 text-xs"
							onClick={() => {
								setEditingTxn(null);
								setTxnDialogOpen(true);
							}}
						>
							<Plus className="mr-1 size-3" />
							Add
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{recentTxns.length === 0 ? (
						<p className="text-sm text-muted-foreground py-4 text-center">
							No transactions yet. Add one manually or import a CSV.
						</p>
					) : (
						<div className="space-y-1">
							{recentTxns.map((txn) => (
								<div
									key={txn.id}
									className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/30 transition-colors group"
								>
									<div className="flex items-center gap-2.5 min-w-0">
										{txnTypeIcon(txn.type)}
										<div className="min-w-0">
											<p className="text-sm text-foreground truncate">
												{txn.description || txn.category}
											</p>
											<p className="text-[11px] text-muted-foreground">
												{new Date(txn.date).toLocaleDateString("en-AU", {
													day: "numeric",
													month: "short",
												})}
												{" · "}
												{txn.category}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										<span
											className={`text-sm font-mono font-medium ${
												txn.type === "income"
													? "text-green-600 dark:text-green-400"
													: txn.type === "expense"
														? "text-red-600 dark:text-red-400"
														: "text-blue-600 dark:text-blue-400"
											}`}
										>
											{txn.type === "income" ? "+" : txn.type === "expense" ? "−" : ""}$
											{Math.abs(txn.amount).toLocaleString("en-AU", {
												minimumFractionDigits: 2,
												maximumFractionDigits: 2,
											})}
										</span>
										<div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0"
												onClick={() => {
													setEditingTxn(txn);
													setTxnDialogOpen(true);
												}}
											>
												<Pencil className="size-3" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0 text-destructive hover:text-destructive"
												onClick={() => {
													if (window.confirm("Delete this transaction?")) {
														deleteTxnMut.mutate(txn.id);
													}
												}}
											>
												<Trash2 className="size-3" />
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<div className="grid gap-4 lg:grid-cols-2">

				{metadataEntries.length > 0 && (
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								Details
							</CardTitle>
						</CardHeader>
						<CardContent>
							<dl className="space-y-2">
								{metadataEntries.map(([key, value]) => (
									<div key={key} className="flex justify-between text-sm">
										<dt className="text-muted-foreground">
											{key.replace(/_/g, " ")}
										</dt>
										<dd className="font-medium text-foreground">
											{String(value)}
										</dd>
									</div>
								))}
							</dl>
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Account Info
						</CardTitle>
					</CardHeader>
					<CardContent>
						<dl className="space-y-2">
							<div className="flex justify-between text-sm">
								<dt className="text-muted-foreground">Created</dt>
								<dd className="font-medium text-foreground">
									{new Date(account.created_at).toLocaleDateString("en-AU")}
								</dd>
							</div>
							<div className="flex justify-between text-sm">
								<dt className="text-muted-foreground">Last updated</dt>
								<dd className="font-medium text-foreground">
									{new Date(account.updated_at).toLocaleDateString("en-AU")}
								</dd>
							</div>
							<div className="flex justify-between text-sm">
								<dt className="text-muted-foreground">Status</dt>
								<dd className="font-medium text-foreground">
									{account.is_active ? "Active" : "Archived"}
								</dd>
							</div>
						</dl>
					</CardContent>
				</Card>
			</div>

			<AccountFormDialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
				account={account}
				onSubmit={(data) => updateMutation.mutate(data)}
				isPending={updateMutation.isPending}
			/>

			<TransactionFormDialog
				open={txnDialogOpen}
				onOpenChange={(o) => {
					setTxnDialogOpen(o);
					if (!o) setEditingTxn(null);
				}}
				transaction={editingTxn}
				defaultAccountId={id}
				onSubmit={handleTxnSubmit}
				isPending={createTxnMut.isPending || updateTxnMut.isPending}
			/>

			<CsvImportDialog
				open={csvImportOpen}
				onOpenChange={setCsvImportOpen}
				defaultAccountId={id}
			/>
		</div>
	);
}
