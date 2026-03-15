import { Badge, Button, Card, CardContent } from "@khufushome/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
	ArrowRightLeft,
	BarChart3,
	BookOpen,
	Calculator,
	CheckCircle2,
	FileText,
	LineChart,
	Pencil,
	PieChart,
	Plus,
	TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { FundSwitchDialog } from "../../components/super/FundSwitchDialog";
import { SuperAccountDialog } from "../../components/super/SuperAccountDialog";
import {
	createFundSwitch,
	createSuperAccount,
	fetchSuperAccounts,
	updateSuperAccount,
} from "../../lib/super-api";
import type {
	FundSwitchInsert,
	SuperAccount,
	SuperAccountInsert,
} from "../../lib/super-types";

export const Route = createFileRoute("/super/")({
	component: SuperLandingPage,
});

const sections = [
	{
		title: "Analysis — Overview",
		description: "Enter quarterly snapshots, view balance and contributions.",
		to: "/super/analysis",
		icon: BarChart3,
	},
	{
		title: "Historical Performance",
		description:
			"Compare your fund vs alternatives and SMSF Bitcoin what-if.",
		to: "/super/analysis/historical",
		icon: LineChart,
	},
	{
		title: "Projections",
		description: "Future balance projections based on contribution scenarios.",
		to: "/super/analysis/projections",
		icon: TrendingUp,
	},
	{
		title: "Research — Fund Returns",
		description: "APRA quarterly and annual return data for tracked funds.",
		to: "/super/research",
		icon: FileText,
	},
	{
		title: "Research — Allocations",
		description: "Strategic asset allocation breakdowns by fund.",
		to: "/super/research/allocations",
		icon: PieChart,
	},
	{
		title: "Research — Fees",
		description: "Admin, investment, and total fee comparison.",
		to: "/super/research/fees",
		icon: Calculator,
	},
	{
		title: "Research — Papers",
		description: "In-depth research papers for each tracked fund.",
		to: "/super/research/papers",
		icon: BookOpen,
	},
] as const;

function SuperAccountCard({ account, onEdit }: { account: SuperAccount; onEdit: () => void }) {
	const meta = account.metadata;
	return (
		<Card className={account.is_active ? "border-primary/30" : "opacity-60"}>
			<CardContent className="p-5">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<div className="flex items-center gap-2">
							<p className="text-sm font-semibold text-foreground truncate">
								{account.name}
							</p>
							{account.is_active ? (
								<Badge className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-500/20">
									<CheckCircle2 className="mr-0.5 size-2.5" />
									Active
								</Badge>
							) : (
								<Badge variant="secondary" className="text-[10px] px-1.5 py-0">
									Archived
								</Badge>
							)}
						</div>
						<p className="mt-1 text-xs text-muted-foreground">
							{meta.fund_name}
							{meta.investment_option && ` — ${meta.investment_option}`}
						</p>
						{meta.member_number && (
							<p className="mt-0.5 text-xs text-muted-foreground">
								Member: {meta.member_number}
							</p>
						)}
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="size-7 p-0 shrink-0"
						onClick={onEdit}
						title="Edit"
					>
						<Pencil className="size-3.5" />
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

function SuperLandingPage() {
	const queryClient = useQueryClient();
	const [accountDialogOpen, setAccountDialogOpen] = useState(false);
	const [editingAccount, setEditingAccount] = useState<SuperAccount | null>(null);
	const [switchDialogOpen, setSwitchDialogOpen] = useState(false);

	const { data: accounts = [] } = useQuery({
		queryKey: ["super-accounts"],
		queryFn: fetchSuperAccounts,
	});

	const activeAccount = accounts.find((a) => a.is_active) ?? null;

	const createAccountMut = useMutation({
		mutationFn: (data: SuperAccountInsert) => createSuperAccount(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["super-accounts"] });
			setAccountDialogOpen(false);
		},
	});

	const updateAccountMut = useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<SuperAccountInsert> & { is_active?: boolean } }) =>
			updateSuperAccount(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["super-accounts"] });
			setAccountDialogOpen(false);
			setEditingAccount(null);
		},
	});

	const switchMut = useMutation({
		mutationFn: async ({
			switchData,
			newAccountData,
		}: {
			switchData: FundSwitchInsert;
			newAccountData: {
				name: string;
				institution?: string;
				metadata: { fund_name: string; investment_option?: string; member_number?: string };
			};
		}) => {
			let toAccountId = switchData.to_account_id;

			if (!toAccountId) {
				const newAcct = await createSuperAccount(newAccountData);
				toAccountId = newAcct.id;
			}

			if (switchData.from_account_id) {
				await updateSuperAccount(switchData.from_account_id, { is_active: false });
			}

			await createFundSwitch({
				...switchData,
				to_account_id: toAccountId,
			});

			await updateSuperAccount(toAccountId, { is_active: true });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["super-accounts"] });
			setSwitchDialogOpen(false);
		},
	});

	const handleOpenCreate = () => {
		setEditingAccount(null);
		setAccountDialogOpen(true);
	};

	const handleOpenEdit = (acct: SuperAccount) => {
		setEditingAccount(acct);
		setAccountDialogOpen(true);
	};

	const handleAccountSubmit = (data: SuperAccountInsert) => {
		if (editingAccount) {
			updateAccountMut.mutate({ id: editingAccount.id, data });
		} else {
			createAccountMut.mutate(data);
		}
	};

	const handleSwitchSubmit = (
		switchData: FundSwitchInsert,
		newAccountData: {
			name: string;
			institution?: string;
			metadata: { fund_name: string; investment_option?: string; member_number?: string };
		},
	) => {
		switchMut.mutate({ switchData, newAccountData });
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-display text-2xl font-bold text-foreground">
						Superannuation
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Super fund tracking — analysis, research, and projections.
					</p>
				</div>
				<div className="flex gap-2">
					{activeAccount && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSwitchDialogOpen(true)}
						>
							<ArrowRightLeft className="mr-1.5 size-4" />
							Switch Fund
						</Button>
					)}
					<Button size="sm" onClick={handleOpenCreate}>
						<Plus className="mr-1.5 size-4" />
						Add Fund
					</Button>
				</div>
			</div>

			{accounts.length > 0 && (
				<div>
					<h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
						Your Super Funds
					</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{accounts.map((acct) => (
							<SuperAccountCard
								key={acct.id}
								account={acct}
								onEdit={() => handleOpenEdit(acct)}
							/>
						))}
					</div>
				</div>
			)}

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{sections.map((s) => (
					<Link key={s.to} to={s.to} className="group">
						<Card className="h-full transition-colors group-hover:border-primary/40">
							<CardContent className="flex items-start gap-4 p-5">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<s.icon className="size-5" />
								</div>
								<div>
									<p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
										{s.title}
									</p>
									<p className="mt-1 text-xs text-muted-foreground leading-relaxed">
										{s.description}
									</p>
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>

			<SuperAccountDialog
				open={accountDialogOpen}
				onOpenChange={setAccountDialogOpen}
				account={editingAccount}
				onSubmit={handleAccountSubmit}
				isPending={createAccountMut.isPending || updateAccountMut.isPending}
			/>

			<FundSwitchDialog
				open={switchDialogOpen}
				onOpenChange={setSwitchDialogOpen}
				accounts={accounts}
				activeAccountId={activeAccount?.id ?? null}
				onSubmit={handleSwitchSubmit}
				isPending={switchMut.isPending}
			/>
		</div>
	);
}
