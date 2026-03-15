import {
	Badge,
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
import { X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { fetchAccounts } from "../../lib/accounts-api";
import {
	DEFAULT_CATEGORIES,
	TRANSACTION_TYPES,
	TRANSACTION_TYPE_LABELS,
	type Transaction,
	type TransactionInsert,
	type TransactionType,
	type TransactionUpdate,
} from "../../lib/types";

interface TransactionFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction?: Transaction | null;
	defaultAccountId?: string;
	onSubmit: (data: TransactionInsert | TransactionUpdate) => void;
	isPending: boolean;
}

export function TransactionFormDialog({
	open,
	onOpenChange,
	transaction,
	defaultAccountId,
	onSubmit,
	isPending,
}: TransactionFormDialogProps) {
	const isEditing = !!transaction;

	const { data: accounts } = useQuery({
		queryKey: ["accounts"],
		queryFn: () => fetchAccounts(false),
	});

	const [accountId, setAccountId] = useState("");
	const [type, setType] = useState<TransactionType>("expense");
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState("");
	const [customCategory, setCustomCategory] = useState("");
	const [subcategory, setSubcategory] = useState("");
	const [description, setDescription] = useState("");
	const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [isRecurring, setIsRecurring] = useState(false);
	const [recurrenceRule, setRecurrenceRule] = useState("");
	const [tagInput, setTagInput] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [notes, setNotes] = useState("");

	useEffect(() => {
		if (transaction) {
			setAccountId(transaction.account_id);
			setType(transaction.type);
			setAmount(String(Math.abs(transaction.amount)));
			const cats = DEFAULT_CATEGORIES[transaction.type];
			if (cats.includes(transaction.category)) {
				setCategory(transaction.category);
				setCustomCategory("");
			} else {
				setCategory("__custom__");
				setCustomCategory(transaction.category);
			}
			setSubcategory(transaction.subcategory ?? "");
			setDescription(transaction.description ?? "");
			setDate(transaction.date);
			setIsRecurring(transaction.is_recurring);
			setRecurrenceRule(transaction.recurrence_rule ?? "");
			setTags(transaction.tags ?? []);
			setNotes(transaction.notes ?? "");
		} else {
			setAccountId(defaultAccountId ?? "");
			setType("expense");
			setAmount("");
			setCategory("");
			setCustomCategory("");
			setSubcategory("");
			setDescription("");
			setDate(new Date().toISOString().slice(0, 10));
			setIsRecurring(false);
			setRecurrenceRule("");
			setTags([]);
			setTagInput("");
			setNotes("");
		}
	}, [transaction, defaultAccountId, open]);

	const resolvedCategory =
		category === "__custom__" ? customCategory.trim() : category;

	const categories = DEFAULT_CATEGORIES[type];

	const handleAddTag = () => {
		const tag = tagInput.trim().toLowerCase();
		if (tag && !tags.includes(tag)) {
			setTags([...tags, tag]);
		}
		setTagInput("");
	};

	const handleRemoveTag = (tag: string) => {
		setTags(tags.filter((t) => t !== tag));
	};

	const parsedAmount = Number.parseFloat(amount);
	const isValid =
		accountId &&
		!Number.isNaN(parsedAmount) &&
		parsedAmount > 0 &&
		resolvedCategory &&
		date;

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!isValid) return;

		const data: TransactionInsert = {
			account_id: accountId,
			type,
			amount: parsedAmount,
			category: resolvedCategory,
			subcategory: subcategory.trim() || null,
			description: description.trim() || null,
			date,
			is_recurring: isRecurring,
			recurrence_rule: isRecurring ? recurrenceRule.trim() || null : null,
			tags,
			notes: notes.trim() || null,
		};
		onSubmit(data);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Transaction" : "New Transaction"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the transaction details below."
							: "Manually enter a new transaction."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label
								htmlFor="txn-account"
								className="text-sm font-medium text-foreground"
							>
								Account *
							</label>
							<select
								id="txn-account"
								value={accountId}
								onChange={(e) => setAccountId(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								required
							>
								<option value="">Select account…</option>
								{accounts?.map((a) => (
									<option key={a.id} value={a.id}>
										{a.name}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="txn-type"
								className="text-sm font-medium text-foreground"
							>
								Type *
							</label>
							<select
								id="txn-type"
								value={type}
								onChange={(e) => {
									const t = e.target.value as TransactionType;
									setType(t);
									setCategory("");
									setCustomCategory("");
								}}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								{TRANSACTION_TYPES.map((t) => (
									<option key={t} value={t}>
										{TRANSACTION_TYPE_LABELS[t]}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label
								htmlFor="txn-amount"
								className="text-sm font-medium text-foreground"
							>
								Amount ($) *
							</label>
							<Input
								id="txn-amount"
								type="number"
								step="0.01"
								min="0.01"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder="0.00"
								required
							/>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="txn-date"
								className="text-sm font-medium text-foreground"
							>
								Date *
							</label>
							<Input
								id="txn-date"
								type="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
								required
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label
								htmlFor="txn-category"
								className="text-sm font-medium text-foreground"
							>
								Category *
							</label>
							<select
								id="txn-category"
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								required
							>
								<option value="">Select category…</option>
								{categories.map((c) => (
									<option key={c} value={c}>
										{c}
									</option>
								))}
								<option value="__custom__">Custom…</option>
							</select>
							{category === "__custom__" && (
								<Input
									value={customCategory}
									onChange={(e) => setCustomCategory(e.target.value)}
									placeholder="Enter custom category"
									className="mt-1"
									required
								/>
							)}
						</div>

						<div className="space-y-2">
							<label
								htmlFor="txn-subcategory"
								className="text-sm font-medium text-foreground"
							>
								Subcategory
							</label>
							<Input
								id="txn-subcategory"
								value={subcategory}
								onChange={(e) => setSubcategory(e.target.value)}
								placeholder="Optional"
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label
							htmlFor="txn-description"
							className="text-sm font-medium text-foreground"
						>
							Description
						</label>
						<Input
							id="txn-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="e.g., Woolworths groceries"
						/>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium text-foreground">Tags</label>
						<div className="flex gap-2">
							<Input
								value={tagInput}
								onChange={(e) => setTagInput(e.target.value)}
								placeholder="Add tag…"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddTag();
									}
								}}
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleAddTag}
								className="shrink-0"
							>
								Add
							</Button>
						</div>
						{tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5 mt-1">
								{tags.map((tag) => (
									<Badge
										key={tag}
										variant="secondary"
										className="gap-1 text-xs"
									>
										{tag}
										<button
											type="button"
											onClick={() => handleRemoveTag(tag)}
											className="ml-0.5 hover:text-destructive"
										>
											<X className="size-3" />
										</button>
									</Badge>
								))}
							</div>
						)}
					</div>

					<div className="space-y-2">
						<label className="flex items-center gap-2 text-sm font-medium text-foreground">
							<input
								type="checkbox"
								checked={isRecurring}
								onChange={(e) => setIsRecurring(e.target.checked)}
								className="rounded border-input"
							/>
							Recurring transaction
						</label>
						{isRecurring && (
							<Input
								value={recurrenceRule}
								onChange={(e) => setRecurrenceRule(e.target.value)}
								placeholder="e.g., FREQ=MONTHLY;INTERVAL=1"
								className="mt-1"
							/>
						)}
					</div>

					<div className="space-y-2">
						<label
							htmlFor="txn-notes"
							className="text-sm font-medium text-foreground"
						>
							Notes
						</label>
						<textarea
							id="txn-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Any additional notes…"
							rows={2}
							className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending || !isValid}>
							{isPending
								? isEditing
									? "Saving…"
									: "Creating…"
								: isEditing
									? "Save Changes"
									: "Add Transaction"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
