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
	BalanceSnapshot,
	BalanceSnapshotInsert,
	BalanceSnapshotUpdate,
} from "../../lib/super-types";

interface SnapshotFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	snapshot?: BalanceSnapshot | null;
	superAccountId: string;
	onSubmit: (data: BalanceSnapshotInsert | BalanceSnapshotUpdate) => void;
	isPending: boolean;
}

function parseNum(val: string): number | null {
	const n = Number.parseFloat(val);
	return Number.isNaN(n) ? null : n;
}

export function SnapshotFormDialog({
	open,
	onOpenChange,
	snapshot,
	superAccountId,
	onSubmit,
	isPending,
}: SnapshotFormDialogProps) {
	const isEditing = !!snapshot;
	const [recordedDate, setRecordedDate] = useState("");
	const [balance, setBalance] = useState("");
	const [employerContribution, setEmployerContribution] = useState("");
	const [memberFee, setMemberFee] = useState("");
	const [incomeTax, setIncomeTax] = useState("");
	const [salarySacrifice, setSalarySacrifice] = useState("");
	const [insurancePremium, setInsurancePremium] = useState("");

	useEffect(() => {
		if (snapshot) {
			setRecordedDate(snapshot.recorded_date);
			setBalance(String(snapshot.balance));
			setEmployerContribution(
				snapshot.employer_contribution != null
					? String(snapshot.employer_contribution)
					: "",
			);
			setMemberFee(
				snapshot.member_fee != null ? String(snapshot.member_fee) : "",
			);
			setIncomeTax(
				snapshot.income_tax != null ? String(snapshot.income_tax) : "",
			);
			setSalarySacrifice(
				snapshot.salary_sacrifice != null
					? String(snapshot.salary_sacrifice)
					: "",
			);
			setInsurancePremium(
				snapshot.insurance_premium != null
					? String(snapshot.insurance_premium)
					: "",
			);
		} else {
			setRecordedDate("");
			setBalance("");
			setEmployerContribution("");
			setMemberFee("");
			setIncomeTax("");
			setSalarySacrifice("");
			setInsurancePremium("");
		}
	}, [snapshot]);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const data: BalanceSnapshotInsert = {
			super_account_id: superAccountId,
			recorded_date: recordedDate,
			balance: Number.parseFloat(balance),
			employer_contribution: parseNum(employerContribution),
			salary_sacrifice: parseNum(salarySacrifice),
			member_fee: parseNum(memberFee),
			income_tax: parseNum(incomeTax),
			insurance_premium: parseNum(insurancePremium),
		};
		onSubmit(data);
	};

	const canSubmit = recordedDate && balance && !isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Snapshot" : "New Quarterly Snapshot"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update your quarterly statement figures."
							: "Enter the figures from your quarterly super statement."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label
								htmlFor="snap-date"
								className="text-sm font-medium text-foreground"
							>
								Quarter End Date
							</label>
							<Input
								id="snap-date"
								type="date"
								value={recordedDate}
								onChange={(e) => setRecordedDate(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<label
								htmlFor="snap-balance"
								className="text-sm font-medium text-foreground"
							>
								Closing Balance ($)
							</label>
							<Input
								id="snap-balance"
								type="number"
								step="0.01"
								value={balance}
								onChange={(e) => setBalance(e.target.value)}
								placeholder="e.g., 119000"
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label
								htmlFor="snap-employer"
								className="text-sm font-medium text-foreground"
							>
								Employer Contribution ($)
							</label>
							<Input
								id="snap-employer"
								type="number"
								step="0.01"
								value={employerContribution}
								onChange={(e) => setEmployerContribution(e.target.value)}
								placeholder="e.g., 5625"
							/>
						</div>
						<div className="space-y-2">
							<label
								htmlFor="snap-fee"
								className="text-sm font-medium text-foreground"
							>
								Member Fee ($)
							</label>
							<Input
								id="snap-fee"
								type="number"
								step="0.01"
								value={memberFee}
								onChange={(e) => setMemberFee(e.target.value)}
								placeholder="e.g., 175"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label
								htmlFor="snap-tax"
								className="text-sm font-medium text-foreground"
							>
								Income Tax ($)
							</label>
							<Input
								id="snap-tax"
								type="number"
								step="0.01"
								value={incomeTax}
								onChange={(e) => setIncomeTax(e.target.value)}
								placeholder="Positive = tax, negative = refund"
							/>
						</div>
						<div className="space-y-2">
							<label
								htmlFor="snap-salary-sacrifice"
								className="text-sm font-medium text-foreground"
							>
								Salary Sacrifice ($)
								<span className="ml-1 text-muted-foreground font-normal">
									optional
								</span>
							</label>
							<Input
								id="snap-salary-sacrifice"
								type="number"
								step="0.01"
								value={salarySacrifice}
								onChange={(e) => setSalarySacrifice(e.target.value)}
								placeholder="0"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label
								htmlFor="snap-insurance"
								className="text-sm font-medium text-foreground"
							>
								Insurance Premium ($)
								<span className="ml-1 text-muted-foreground font-normal">
									optional
								</span>
							</label>
							<Input
								id="snap-insurance"
								type="number"
								step="0.01"
								value={insurancePremium}
								onChange={(e) => setInsurancePremium(e.target.value)}
								placeholder="0"
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!canSubmit}>
							{isPending
								? isEditing
									? "Saving..."
									: "Adding..."
								: isEditing
									? "Save Changes"
									: "Add Snapshot"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
