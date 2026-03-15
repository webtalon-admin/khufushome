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
import { type FormEvent, useEffect, useState } from "react";
import type {
	SuperAccount,
	SuperAccountInsert,
	SuperAccountMetadata,
} from "../../lib/super-types";

interface SuperAccountDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	account?: SuperAccount | null;
	onSubmit: (data: SuperAccountInsert) => void;
	isPending: boolean;
}

export function SuperAccountDialog({
	open,
	onOpenChange,
	account,
	onSubmit,
	isPending,
}: SuperAccountDialogProps) {
	const isEdit = !!account;

	const [name, setName] = useState("");
	const [fundName, setFundName] = useState("");
	const [memberNumber, setMemberNumber] = useState("");
	const [investmentOption, setInvestmentOption] = useState("");
	const [institution, setInstitution] = useState("");

	useEffect(() => {
		if (open) {
			if (account) {
				setName(account.name);
				setFundName(account.metadata.fund_name ?? "");
				setMemberNumber(account.metadata.member_number ?? "");
				setInvestmentOption(account.metadata.investment_option ?? "");
				setInstitution(account.institution ?? "");
			} else {
				setName("");
				setFundName("");
				setMemberNumber("");
				setInvestmentOption("");
				setInstitution("");
			}
		}
	}, [open, account]);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!name.trim() || !fundName.trim()) return;

		const metadata: SuperAccountMetadata = {
			fund_name: fundName.trim(),
		};
		if (memberNumber.trim()) metadata.member_number = memberNumber.trim();
		if (investmentOption.trim())
			metadata.investment_option = investmentOption.trim();

		onSubmit({
			name: name.trim(),
			institution: institution.trim() || fundName.trim(),
			metadata,
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>
							{isEdit ? "Edit Super Account" : "Add Super Account"}
						</DialogTitle>
						<DialogDescription>
							{isEdit
								? "Update your super fund details."
								: "Add a new super fund account to track."}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 space-y-4">
						<div className="space-y-1.5">
							<label
								htmlFor="acct-name"
								className="text-sm font-medium text-foreground"
							>
								Display Name *
							</label>
							<Input
								id="acct-name"
								placeholder="e.g. Future Super – Balanced Growth"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
							<p className="text-xs text-muted-foreground">
								A short name to identify this account
							</p>
						</div>

						<div className="space-y-1.5">
							<label
								htmlFor="fund-name"
								className="text-sm font-medium text-foreground"
							>
								Fund Name *
							</label>
							<Input
								id="fund-name"
								placeholder="e.g. Future Super"
								value={fundName}
								onChange={(e) => setFundName(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-1.5">
							<label
								htmlFor="investment-option"
								className="text-sm font-medium text-foreground"
							>
								Investment Option
							</label>
							<Input
								id="investment-option"
								placeholder="e.g. Balanced Growth, High Growth"
								value={investmentOption}
								onChange={(e) => setInvestmentOption(e.target.value)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<label
									htmlFor="member-number"
									className="text-sm font-medium text-foreground"
								>
									Member Number
								</label>
								<Input
									id="member-number"
									placeholder="Optional"
									value={memberNumber}
									onChange={(e) => setMemberNumber(e.target.value)}
								/>
							</div>
							<div className="space-y-1.5">
								<label
									htmlFor="institution"
									className="text-sm font-medium text-foreground"
								>
									Institution
								</label>
								<Input
									id="institution"
									placeholder="Auto-filled from fund name"
									value={institution}
									onChange={(e) => setInstitution(e.target.value)}
								/>
							</div>
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
						<Button
							type="submit"
							disabled={!name.trim() || !fundName.trim() || isPending}
						>
							{isPending
								? "Saving..."
								: isEdit
									? "Save Changes"
									: "Add Account"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
