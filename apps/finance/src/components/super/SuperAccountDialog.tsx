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
import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { fetchFundReferences } from "../../lib/super-api";
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
	const [fundRefId, setFundRefId] = useState("");
	const [memberNumber, setMemberNumber] = useState("");
	const [investmentOption, setInvestmentOption] = useState("");
	const [institution, setInstitution] = useState("");

	const { data: fundRefs = [] } = useQuery({
		queryKey: ["fund-references"],
		queryFn: fetchFundReferences,
		staleTime: 1000 * 60 * 60,
	});

	useEffect(() => {
		if (open) {
			if (account) {
				setName(account.name);
				setFundName(account.metadata.fund_name ?? "");
				setFundRefId(account.metadata.fund_id ?? "");
				setMemberNumber(account.metadata.member_number ?? "");
				setInvestmentOption(account.metadata.investment_option ?? "");
				setInstitution(account.institution ?? "");
			} else {
				setName("");
				setFundName("");
				setFundRefId("");
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
		if (fundRefId) metadata.fund_id = fundRefId;
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

					{fundRefs.length > 0 && (
						<div className="space-y-1.5">
							<label
								htmlFor="fund-ref-id"
								className="text-sm font-medium text-foreground"
							>
								Link to Tracked Fund
							</label>
							<select
								id="fund-ref-id"
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								value={fundRefId}
								onChange={(e) => setFundRefId(e.target.value)}
							>
								<option value="">— None (optional) —</option>
								{fundRefs.map((ref) => (
									<option key={ref.id} value={ref.id}>
										{ref.name} — {ref.option_name}
									</option>
								))}
							</select>
							<p className="text-xs text-muted-foreground">
								Links this account to ATO YourSuper performance data
							</p>
						</div>
					)}

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
