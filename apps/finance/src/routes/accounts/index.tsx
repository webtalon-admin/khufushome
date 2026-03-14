import { Badge, Button, Card, CardContent } from "@khufushome/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
	Archive,
	ArchiveRestore,
	Eye,
	EyeOff,
	Pencil,
	Plus,
	Trash2,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { AccountFormDialog } from "../../components/accounts/AccountFormDialog";
import {
	archiveAccount,
	createAccount,
	deleteAccount,
	fetchAccounts,
	restoreAccount,
	updateAccount,
} from "../../lib/accounts-api";
import {
	ACCOUNT_TYPE_LABELS,
	type Account,
	type AccountInsert,
	type AccountUpdate,
} from "../../lib/types";

export const Route = createFileRoute("/accounts/")({
	component: AccountsPage,
});

const ACCOUNT_TYPE_ICONS: Record<string, string> = {
	checking: "🏦",
	savings: "💰",
	credit_card: "💳",
	investment: "📈",
	crypto_exchange: "₿",
	super: "🏛️",
	offset: "⚖️",
	loan: "🏠",
};

function AccountsPage() {
	const queryClient = useQueryClient();
	const [showArchived, setShowArchived] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingAccount, setEditingAccount] = useState<Account | null>(null);

	const { data: accounts = [], isLoading } = useQuery({
		queryKey: ["accounts", { showArchived }],
		queryFn: () => fetchAccounts(showArchived),
	});

	const createMutation = useMutation({
		mutationFn: (data: AccountInsert) => createAccount(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
			setDialogOpen(false);
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: AccountUpdate }) =>
			updateAccount(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
			setDialogOpen(false);
			setEditingAccount(null);
		},
	});

	const archiveMutation = useMutation({
		mutationFn: (id: string) => archiveAccount(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
		},
	});

	const restoreMutation = useMutation({
		mutationFn: (id: string) => restoreAccount(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => deleteAccount(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["accounts"] });
		},
	});

	const handleOpenCreate = () => {
		setEditingAccount(null);
		setDialogOpen(true);
	};

	const handleOpenEdit = (account: Account) => {
		setEditingAccount(account);
		setDialogOpen(true);
	};

	const handleSubmit = (data: AccountInsert | AccountUpdate) => {
		if (editingAccount) {
			updateMutation.mutate({ id: editingAccount.id, data });
		} else {
			createMutation.mutate(data as AccountInsert);
		}
	};

	const handleDelete = (account: Account) => {
		if (window.confirm(`Delete "${account.name}"? This cannot be undone.`)) {
			deleteMutation.mutate(account.id);
		}
	};

	const activeAccounts = accounts.filter((a) => a.is_active);
	const archivedAccounts = accounts.filter((a) => !a.is_active);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-display text-2xl font-bold text-foreground">
						Accounts
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						{activeAccounts.length} active account
						{activeAccounts.length !== 1 ? "s" : ""}
						{archivedAccounts.length > 0 &&
							` · ${archivedAccounts.length} archived`}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{archivedAccounts.length > 0 && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowArchived(!showArchived)}
						>
							{showArchived ? (
								<EyeOff className="mr-1.5 size-4" />
							) : (
								<Eye className="mr-1.5 size-4" />
							)}
							{showArchived ? "Hide Archived" : "Show Archived"}
						</Button>
					)}
					<Button size="sm" onClick={handleOpenCreate}>
						<Plus className="mr-1.5 size-4" />
						New Account
					</Button>
				</div>
			</div>

			{isLoading ? (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 3 }, (_, i) => (
						<Card key={`skel-${i.toString()}`}>
							<CardContent className="p-5">
								<div className="h-4 w-24 animate-pulse rounded bg-muted" />
								<div className="mt-3 h-6 w-32 animate-pulse rounded bg-muted" />
								<div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
							</CardContent>
						</Card>
					))}
				</div>
			) : accounts.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<div className="flex size-16 items-center justify-center rounded-full bg-muted">
							<Wallet className="size-8 text-muted-foreground" />
						</div>
						<h3 className="mt-4 text-lg font-semibold text-foreground">
							No accounts yet
						</h3>
						<p className="mt-1 text-sm text-muted-foreground">
							Add your first account to start tracking your finances.
						</p>
						<Button className="mt-4" onClick={handleOpenCreate}>
							<Plus className="mr-1.5 size-4" />
							Add Account
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{accounts.map((account) => (
						<AccountCard
							key={account.id}
							account={account}
							onEdit={handleOpenEdit}
							onArchive={(a) => archiveMutation.mutate(a.id)}
							onRestore={(a) => restoreMutation.mutate(a.id)}
							onDelete={handleDelete}
						/>
					))}
				</div>
			)}

			<AccountFormDialog
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				account={editingAccount}
				onSubmit={handleSubmit}
				isPending={createMutation.isPending || updateMutation.isPending}
			/>
		</div>
	);
}

function AccountCard({
	account,
	onEdit,
	onArchive,
	onRestore,
	onDelete,
}: {
	account: Account;
	onEdit: (a: Account) => void;
	onArchive: (a: Account) => void;
	onRestore: (a: Account) => void;
	onDelete: (a: Account) => void;
}) {
	const icon = ACCOUNT_TYPE_ICONS[account.type] ?? "💼";

	return (
		<Card
			className={`transition-colors ${!account.is_active ? "opacity-60" : ""}`}
		>
			<CardContent className="p-5">
				<div className="flex items-start justify-between">
					<Link
						to="/accounts/$id"
						params={{ id: account.id }}
						className="flex-1 group"
					>
						<div className="flex items-center gap-3">
							<span className="text-2xl" role="img" aria-label={account.type}>
								{icon}
							</span>
							<div>
								<p className="text-sm font-semibold text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
									{account.name}
								</p>
								<div className="mt-0.5 flex items-center gap-2">
									<Badge variant="secondary" className="text-xs">
										{ACCOUNT_TYPE_LABELS[account.type]}
									</Badge>
									{!account.is_active && (
										<Badge variant="outline" className="text-xs text-muted-foreground">
											Archived
										</Badge>
									)}
								</div>
							</div>
						</div>
						{account.institution && (
							<p className="mt-2 text-xs text-muted-foreground">
								{account.institution}
							</p>
						)}
					</Link>

					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							className="size-8 p-0"
							onClick={() => onEdit(account)}
							title="Edit"
						>
							<Pencil className="size-3.5" />
						</Button>
						{account.is_active ? (
							<Button
								variant="ghost"
								size="sm"
								className="size-8 p-0"
								onClick={() => onArchive(account)}
								title="Archive"
							>
								<Archive className="size-3.5" />
							</Button>
						) : (
							<>
								<Button
									variant="ghost"
									size="sm"
									className="size-8 p-0"
									onClick={() => onRestore(account)}
									title="Restore"
								>
									<ArchiveRestore className="size-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="size-8 p-0 text-destructive hover:text-destructive"
									onClick={() => onDelete(account)}
									title="Delete permanently"
								>
									<Trash2 className="size-3.5" />
								</Button>
							</>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
