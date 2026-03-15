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
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type {
	BalanceSnapshot,
	BalanceSnapshotInsert,
	BalanceSnapshotUpdate,
} from "../../lib/super-types";

const QUARTER_ENDS = [
	{ month: 3, day: 31, label: "Q1 (Jan–Mar)" },
	{ month: 6, day: 30, label: "Q2 (Apr–Jun)" },
	{ month: 9, day: 30, label: "Q3 (Jul–Sep)" },
	{ month: 12, day: 31, label: "Q4 (Oct–Dec)" },
];

function nextQuarterEnd(after: string | null): { date: string; label: string } {
	const ref = after ? new Date(`${after}T00:00:00`) : new Date();
	const refYear = ref.getFullYear();
	const refMonth = ref.getMonth() + 1;
	const refDay = ref.getDate();

	for (const q of QUARTER_ENDS) {
		if (
			q.month > refMonth ||
			(q.month === refMonth && q.day > refDay)
		) {
			const d = `${refYear}-${String(q.month).padStart(2, "0")}-${String(q.day).padStart(2, "0")}`;
			return { date: d, label: `${q.label} ${refYear}` };
		}
	}
	const d = `${refYear + 1}-03-31`;
	return { date: d, label: `Q1 (Jan–Mar) ${refYear + 1}` };
}

function quarterLabel(dateStr: string): string {
	const d = new Date(`${dateStr}T00:00:00`);
	const m = d.getMonth() + 1;
	const y = d.getFullYear();
	if (m <= 3) return `Q1 (Jan–Mar) ${y}`;
	if (m <= 6) return `Q2 (Apr–Jun) ${y}`;
	if (m <= 9) return `Q3 (Jul–Sep) ${y}`;
	return `Q4 (Oct–Dec) ${y}`;
}

interface FieldError {
	balance?: string;
	employerContribution?: string;
	memberFee?: string;
	incomeTax?: string;
	salarySacrifice?: string;
	insurancePremium?: string;
}

function validateNum(
	raw: string,
	opts: { required?: boolean; min?: number; fieldName: string },
): { value: number | null; error?: string } {
	const trimmed = raw.trim();
	if (!trimmed) {
		if (opts.required) return { value: null, error: `${opts.fieldName} is required` };
		return { value: null };
	}
	const n = Number(trimmed);
	if (Number.isNaN(n)) return { value: null, error: `${opts.fieldName} must be a number` };
	if (opts.min !== undefined && n < opts.min)
		return { value: null, error: `${opts.fieldName} must be at least ${opts.min}` };
	return { value: Math.round(n * 100) / 100 };
}

interface SnapshotFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	snapshot?: BalanceSnapshot | null;
	superAccountId: string;
	latestSnapshotDate: string | null;
	onSubmit: (data: BalanceSnapshotInsert | BalanceSnapshotUpdate) => void;
	isPending: boolean;
}

export function SnapshotFormDialog({
	open,
	onOpenChange,
	snapshot,
	superAccountId,
	latestSnapshotDate,
	onSubmit,
	isPending,
}: SnapshotFormDialogProps) {
	const isEditing = !!snapshot;

	const nextQtr = useMemo(
		() => nextQuarterEnd(latestSnapshotDate),
		[latestSnapshotDate],
	);

	const [balance, setBalance] = useState("");
	const [employerContribution, setEmployerContribution] = useState("");
	const [memberFee, setMemberFee] = useState("");
	const [incomeTax, setIncomeTax] = useState("");
	const [salarySacrifice, setSalarySacrifice] = useState("");
	const [insurancePremium, setInsurancePremium] = useState("");
	const [errors, setErrors] = useState<FieldError>({});
	const [submitted, setSubmitted] = useState(false);

	useEffect(() => {
		if (snapshot) {
			setBalance(snapshot.balance != null ? String(snapshot.balance) : "");
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
			setBalance("");
			setEmployerContribution("");
			setMemberFee("");
			setIncomeTax("");
			setSalarySacrifice("");
			setInsurancePremium("");
		}
		setErrors({});
		setSubmitted(false);
	}, [snapshot, open]);

	function validate(): { valid: boolean; data: BalanceSnapshotInsert | null } {
		const e: FieldError = {};

		const bal = validateNum(balance, { required: true, min: 0, fieldName: "Balance" });
		if (bal.error) e.balance = bal.error;

		const emp = validateNum(employerContribution, { required: true, min: 0, fieldName: "Employer Contribution" });
		if (emp.error) e.employerContribution = emp.error;

		const fee = validateNum(memberFee, { required: true, min: 0, fieldName: "Member Fee" });
		if (fee.error) e.memberFee = fee.error;

		const tax = validateNum(incomeTax, { required: false, fieldName: "Income Tax" });
		if (tax.error) e.incomeTax = tax.error;

		const sal = validateNum(salarySacrifice, { required: false, min: 0, fieldName: "Salary Sacrifice" });
		if (sal.error) e.salarySacrifice = sal.error;

		const ins = validateNum(insurancePremium, { required: false, min: 0, fieldName: "Insurance Premium" });
		if (ins.error) e.insurancePremium = ins.error;

		setErrors(e);
		if (Object.keys(e).length > 0) return { valid: false, data: null };

		const recordedDate = isEditing ? snapshot!.recorded_date : nextQtr.date;

		return {
			valid: true,
			data: {
				super_account_id: superAccountId,
				recorded_date: recordedDate,
				balance: bal.value!,
				employer_contribution: emp.value!,
				salary_sacrifice: sal.value,
				member_fee: fee.value!,
				income_tax: tax.value,
				insurance_premium: ins.value,
			},
		};
	}

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		setSubmitted(true);
		const { valid, data } = validate();
		if (valid && data) onSubmit(data);
	};

	const displayDate = isEditing
		? quarterLabel(snapshot!.recorded_date)
		: nextQtr.label;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Snapshot" : "New Quarterly Snapshot"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? `Update the figures for ${displayDate}.`
							: `Enter figures from your ${displayDate} quarterly statement.`}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4" noValidate>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-sm font-medium text-foreground">
								Quarter
							</label>
							<div className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm font-medium text-foreground">
								{displayDate}
							</div>
						</div>
						<div className="space-y-2">
							<label
								htmlFor="snap-balance"
								className="text-sm font-medium text-foreground"
							>
								Closing Balance ($)
								<span className="text-destructive ml-0.5">*</span>
							</label>
							<Input
								id="snap-balance"
								type="number"
								inputMode="decimal"
								step="0.01"
								min="0"
								value={balance}
								onChange={(e) => setBalance(e.target.value)}
								placeholder="e.g. 119000"
								aria-invalid={submitted && !!errors.balance}
							/>
							{submitted && errors.balance && (
								<p className="text-xs text-destructive">{errors.balance}</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label
								htmlFor="snap-employer"
								className="text-sm font-medium text-foreground"
							>
								Employer Contribution ($)
								<span className="text-destructive ml-0.5">*</span>
							</label>
							<Input
								id="snap-employer"
								type="number"
								inputMode="decimal"
								step="0.01"
								min="0"
								value={employerContribution}
								onChange={(e) => setEmployerContribution(e.target.value)}
								placeholder="e.g. 5625"
								aria-invalid={submitted && !!errors.employerContribution}
							/>
							{submitted && errors.employerContribution && (
								<p className="text-xs text-destructive">
									{errors.employerContribution}
								</p>
							)}
						</div>
						<div className="space-y-2">
							<label
								htmlFor="snap-fee"
								className="text-sm font-medium text-foreground"
							>
								Member Fee ($)
								<span className="text-destructive ml-0.5">*</span>
							</label>
							<Input
								id="snap-fee"
								type="number"
								inputMode="decimal"
								step="0.01"
								min="0"
								value={memberFee}
								onChange={(e) => setMemberFee(e.target.value)}
								placeholder="e.g. 175"
								aria-invalid={submitted && !!errors.memberFee}
							/>
							{submitted && errors.memberFee && (
								<p className="text-xs text-destructive">{errors.memberFee}</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label
								htmlFor="snap-tax"
								className="text-sm font-medium text-foreground"
							>
								Income Tax ($)
								<span className="ml-1 text-muted-foreground font-normal text-xs">
									negative = refund
								</span>
							</label>
							<Input
								id="snap-tax"
								type="number"
								inputMode="decimal"
								step="0.01"
								value={incomeTax}
								onChange={(e) => setIncomeTax(e.target.value)}
								placeholder="e.g. 560"
								aria-invalid={submitted && !!errors.incomeTax}
							/>
							{submitted && errors.incomeTax && (
								<p className="text-xs text-destructive">{errors.incomeTax}</p>
							)}
						</div>
						<div className="space-y-2">
							<label
								htmlFor="snap-salary-sacrifice"
								className="text-sm font-medium text-foreground"
							>
								Salary Sacrifice ($)
								<span className="ml-1 text-muted-foreground font-normal text-xs">
									optional
								</span>
							</label>
							<Input
								id="snap-salary-sacrifice"
								type="number"
								inputMode="decimal"
								step="0.01"
								min="0"
								value={salarySacrifice}
								onChange={(e) => setSalarySacrifice(e.target.value)}
								placeholder="0"
								aria-invalid={submitted && !!errors.salarySacrifice}
							/>
							{submitted && errors.salarySacrifice && (
								<p className="text-xs text-destructive">
									{errors.salarySacrifice}
								</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label
								htmlFor="snap-insurance"
								className="text-sm font-medium text-foreground"
							>
								Insurance Premium ($)
								<span className="ml-1 text-muted-foreground font-normal text-xs">
									optional
								</span>
							</label>
							<Input
								id="snap-insurance"
								type="number"
								inputMode="decimal"
								step="0.01"
								min="0"
								value={insurancePremium}
								onChange={(e) => setInsurancePremium(e.target.value)}
								placeholder="0"
								aria-invalid={submitted && !!errors.insurancePremium}
							/>
							{submitted && errors.insurancePremium && (
								<p className="text-xs text-destructive">
									{errors.insurancePremium}
								</p>
							)}
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
						<Button type="submit" disabled={isPending}>
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
