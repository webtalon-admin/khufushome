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
	ArrowLeft,
	Pencil,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { AccountFormDialog } from "../../components/accounts/AccountFormDialog";
import {
	archiveAccount,
	deleteAccount,
	fetchAccount,
	restoreAccount,
	updateAccount,
} from "../../lib/accounts-api";
import { ACCOUNT_TYPE_LABELS, type AccountUpdate } from "../../lib/types";

export const Route = createFileRoute("/accounts/$id")({
	component: AccountDetailPage,
});

function AccountDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [editDialogOpen, setEditDialogOpen] = useState(false);

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

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Recent Transactions
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							No transactions yet for this account. Import a CSV or add
							transactions manually.
						</p>
					</CardContent>
				</Card>

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
		</div>
	);
}
