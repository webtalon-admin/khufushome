import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
} from "@khufushome/ui";
import { type FormEvent, useState } from "react";
import type { FundSwitchInsert, SuperAccount } from "../../lib/super-types";

interface FundSwitchDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	accounts: SuperAccount[];
	activeAccountId: string | null;
	onSubmit: (data: FundSwitchInsert, newAccountData: {
		name: string;
		institution?: string;
		metadata: { fund_name: string; investment_option?: string; member_number?: string };
	}) => void;
	isPending: boolean;
}

export function FundSwitchDialog({
	open,
	onOpenChange,
	accounts,
	activeAccountId,
	onSubmit,
	isPending,
}: FundSwitchDialogProps) {
	const [switchDate, setSwitchDate] = useState(
		new Date().toISOString().slice(0, 10),
	);
	const [balanceAtSwitch, setBalanceAtSwitch] = useState("");
	const [reason, setReason] = useState("");
	const [newFundName, setNewFundName] = useState("");
	const [newDisplayName, setNewDisplayName] = useState("");
	const [newOption, setNewOption] = useState("");
	const [targetAccountId, setTargetAccountId] = useState<string | "new">("new");

	const existingTargets = accounts.filter((a) => a.id !== activeAccountId);
	const fromAccount = accounts.find((a) => a.id === activeAccountId);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!switchDate) return;

		const isNew = targetAccountId === "new";
		if (isNew && !newFundName.trim()) return;

		const switchData: FundSwitchInsert = {
			from_account_id: activeAccountId,
			to_account_id: isNew ? "" : targetAccountId,
			switch_date: switchDate,
			reason: reason.trim() || undefined,
			balance_at_switch: balanceAtSwitch
				? Number(balanceAtSwitch)
				: undefined,
		};

		const newAccountData = {
			name: newDisplayName.trim() || `${newFundName.trim()} – ${newOption.trim() || "Default"}`,
			institution: newFundName.trim(),
			metadata: {
				fund_name: newFundName.trim(),
				investment_option: newOption.trim() || undefined,
			},
		};

		onSubmit(switchData, newAccountData);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Record Fund Switch</DialogTitle>
						<DialogDescription>
							Record when you switch from{" "}
							{fromAccount ? (
								<span className="font-medium text-foreground">
									{fromAccount.name}
								</span>
							) : (
								"your current fund"
							)}{" "}
							to a new fund. The old fund will be archived.
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 space-y-4">
						<div className="space-y-1.5">
							<label
								htmlFor="switch-date"
								className="text-sm font-medium text-foreground"
							>
								Switch Date *
							</label>
							<Input
								id="switch-date"
								type="date"
								value={switchDate}
								onChange={(e) => setSwitchDate(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-1.5">
							<label
								htmlFor="balance-at-switch"
								className="text-sm font-medium text-foreground"
							>
								Balance at Switch ($)
							</label>
							<Input
								id="balance-at-switch"
								type="number"
								step="0.01"
								min="0"
								placeholder="Optional — closing balance in old fund"
								value={balanceAtSwitch}
								onChange={(e) => setBalanceAtSwitch(e.target.value)}
							/>
						</div>

						<div className="space-y-1.5">
							<label
								htmlFor="switch-target"
								className="text-sm font-medium text-foreground"
							>
								Switch To *
							</label>
							<select
								id="switch-target"
								value={targetAccountId}
								onChange={(e) => setTargetAccountId(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								<option value="new">+ New Fund</option>
								{existingTargets.map((a) => (
									<option key={a.id} value={a.id}>
										{a.name}
									</option>
								))}
							</select>
						</div>

						{targetAccountId === "new" && (
							<div className="space-y-3 rounded-lg border bg-muted/30 p-3">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									New Fund Details
								</p>
								<div className="space-y-1.5">
									<label
										htmlFor="new-fund-name"
										className="text-sm font-medium text-foreground"
									>
										Fund Name *
									</label>
									<Input
										id="new-fund-name"
										placeholder="e.g. Hostplus"
										value={newFundName}
										onChange={(e) => setNewFundName(e.target.value)}
										required={targetAccountId === "new"}
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1.5">
										<label
											htmlFor="new-option"
											className="text-sm font-medium text-foreground"
										>
											Investment Option
										</label>
										<Input
											id="new-option"
											placeholder="e.g. Balanced"
											value={newOption}
											onChange={(e) => setNewOption(e.target.value)}
										/>
									</div>
									<div className="space-y-1.5">
										<label
											htmlFor="new-display"
											className="text-sm font-medium text-foreground"
										>
											Display Name
										</label>
										<Input
											id="new-display"
											placeholder="Auto-generated"
											value={newDisplayName}
											onChange={(e) => setNewDisplayName(e.target.value)}
										/>
									</div>
								</div>
							</div>
						)}

						<div className="space-y-1.5">
							<label
								htmlFor="switch-reason"
								className="text-sm font-medium text-foreground"
							>
								Reason
							</label>
							<Input
								id="switch-reason"
								placeholder="Optional — e.g. Lower fees, better performance"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
							/>
						</div>
					</div>

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Recording..." : "Record Switch"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
