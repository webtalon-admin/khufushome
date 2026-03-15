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
import {
	CONTRIBUTION_TYPES,
	CONTRIBUTION_TYPE_LABELS,
	type Contribution,
	type ContributionInsert,
	type ContributionType,
	type ContributionUpdate,
} from "../../lib/super-types";

function toFinancialYear(dateStr: string): string {
	const d = new Date(`${dateStr}T00:00:00`);
	const year = d.getFullYear();
	const month = d.getMonth() + 1;
	if (month >= 7) {
		return `${year}-${year + 1}`;
	}
	return `${year - 1}-${year}`;
}

interface ContributionFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	contribution?: Contribution | null;
	superAccountId: string;
	onSubmit: (data: ContributionInsert | ContributionUpdate, id?: string) => void;
	isPending: boolean;
}

export function ContributionFormDialog({
	open,
	onOpenChange,
	contribution,
	superAccountId,
	onSubmit,
	isPending,
}: ContributionFormDialogProps) {
	const isEdit = !!contribution;

	const [type, setType] = useState<ContributionType>("employer_sg");
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
	const [employerName, setEmployerName] = useState("");
	const [notes, setNotes] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (open) {
			if (contribution) {
				setType(contribution.type);
				setAmount(String(contribution.amount));
				setDate(contribution.date);
				setEmployerName(contribution.employer_name ?? "");
				setNotes(contribution.notes ?? "");
			} else {
				setType("employer_sg");
				setAmount("");
				setDate(new Date().toISOString().slice(0, 10));
				setEmployerName("");
				setNotes("");
			}
			setErrors({});
		}
	}, [open, contribution]);

	const validate = (): boolean => {
		const errs: Record<string, string> = {};
		const amt = Number(amount);
		if (!amount || Number.isNaN(amt)) {
			errs.amount = "Amount is required";
		} else if (amt <= 0) {
			errs.amount = "Amount must be greater than 0";
		} else if (amt > 999999) {
			errs.amount = "Amount seems too large";
		}
		if (!date) {
			errs.date = "Date is required";
		}
		setErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		const fy = toFinancialYear(date);

		if (isEdit && contribution) {
			const updates: ContributionUpdate = {
				type,
				amount: Number(amount),
				date,
				financial_year: fy,
				employer_name: employerName.trim() || undefined,
				notes: notes.trim() || undefined,
			};
			onSubmit(updates, contribution.id);
		} else {
			const insert: ContributionInsert = {
				super_account_id: superAccountId,
				type,
				amount: Number(amount),
				date,
				financial_year: fy,
				employer_name: employerName.trim() || undefined,
				notes: notes.trim() || undefined,
			};
			onSubmit(insert);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>
							{isEdit ? "Edit Contribution" : "Record Contribution"}
						</DialogTitle>
						<DialogDescription>
							{isEdit
								? "Update this contribution record."
								: "Add a new super contribution entry."}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 space-y-4">
						<div className="space-y-1.5">
							<label
								htmlFor="contrib-type"
								className="text-sm font-medium text-foreground"
							>
								Contribution Type *
							</label>
							<select
								id="contrib-type"
								value={type}
								onChange={(e) => setType(e.target.value as ContributionType)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								{CONTRIBUTION_TYPES.map((t) => (
									<option key={t} value={t}>
										{CONTRIBUTION_TYPE_LABELS[t]}
									</option>
								))}
							</select>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1.5">
								<label
									htmlFor="contrib-amount"
									className="text-sm font-medium text-foreground"
								>
									Amount ($) *
								</label>
								<Input
									id="contrib-amount"
									type="number"
									step="0.01"
									min="0.01"
									placeholder="0.00"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									className={errors.amount ? "border-destructive" : ""}
								/>
								{errors.amount && (
									<p className="text-xs text-destructive">{errors.amount}</p>
								)}
							</div>
							<div className="space-y-1.5">
								<label
									htmlFor="contrib-date"
									className="text-sm font-medium text-foreground"
								>
									Date *
								</label>
								<Input
									id="contrib-date"
									type="date"
									value={date}
									onChange={(e) => setDate(e.target.value)}
									className={errors.date ? "border-destructive" : ""}
								/>
								{errors.date && (
									<p className="text-xs text-destructive">{errors.date}</p>
								)}
							</div>
						</div>

						<div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
							Financial Year: <span className="font-medium text-foreground">{date ? toFinancialYear(date) : "—"}</span>
							{" "}(auto-calculated from date)
						</div>

						{type === "employer_sg" && (
							<div className="space-y-1.5">
								<label
									htmlFor="employer-name"
									className="text-sm font-medium text-foreground"
								>
									Employer Name
								</label>
								<Input
									id="employer-name"
									placeholder="Optional"
									value={employerName}
									onChange={(e) => setEmployerName(e.target.value)}
								/>
							</div>
						)}

						<div className="space-y-1.5">
							<label
								htmlFor="contrib-notes"
								className="text-sm font-medium text-foreground"
							>
								Notes
							</label>
							<Input
								id="contrib-notes"
								placeholder="Optional"
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
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
							{isPending
								? "Saving..."
								: isEdit
									? "Save Changes"
									: "Add Contribution"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
