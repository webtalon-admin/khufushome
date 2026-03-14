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
	ACCOUNT_TYPES,
	ACCOUNT_TYPE_LABELS,
	type Account,
	type AccountInsert,
	type AccountType,
	type AccountUpdate,
} from "../../lib/types";

interface AccountFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	account?: Account | null;
	onSubmit: (data: AccountInsert | AccountUpdate) => void;
	isPending: boolean;
}

export function AccountFormDialog({
	open,
	onOpenChange,
	account,
	onSubmit,
	isPending,
}: AccountFormDialogProps) {
	const isEditing = !!account;
	const [name, setName] = useState("");
	const [type, setType] = useState<AccountType>("savings");
	const [institution, setInstitution] = useState("");
	const [currency, setCurrency] = useState("AUD");

	useEffect(() => {
		if (account) {
			setName(account.name);
			setType(account.type);
			setInstitution(account.institution ?? "");
			setCurrency(account.currency);
		} else {
			setName("");
			setType("savings");
			setInstitution("");
			setCurrency("AUD");
		}
	}, [account]);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const data = {
			name: name.trim(),
			type,
			institution: institution.trim() || null,
			currency,
		};
		onSubmit(data);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Account" : "New Account"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update the account details below."
							: "Add a new financial account to track."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<label
							htmlFor="acc-name"
							className="text-sm font-medium text-foreground"
						>
							Account Name
						</label>
						<Input
							id="acc-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., Macquarie Everyday"
							required
						/>
					</div>

					<div className="space-y-2">
						<label
							htmlFor="acc-type"
							className="text-sm font-medium text-foreground"
						>
							Type
						</label>
						<select
							id="acc-type"
							value={type}
							onChange={(e) => setType(e.target.value as AccountType)}
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						>
							{ACCOUNT_TYPES.map((t) => (
								<option key={t} value={t}>
									{ACCOUNT_TYPE_LABELS[t]}
								</option>
							))}
						</select>
					</div>

					<div className="space-y-2">
						<label
							htmlFor="acc-institution"
							className="text-sm font-medium text-foreground"
						>
							Institution
						</label>
						<Input
							id="acc-institution"
							value={institution}
							onChange={(e) => setInstitution(e.target.value)}
							placeholder="e.g., Macquarie, CommBank, Coinbase"
						/>
					</div>

					<div className="space-y-2">
						<label
							htmlFor="acc-currency"
							className="text-sm font-medium text-foreground"
						>
							Currency
						</label>
						<Input
							id="acc-currency"
							value={currency}
							onChange={(e) => setCurrency(e.target.value.toUpperCase())}
							placeholder="AUD"
							maxLength={3}
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
						<Button type="submit" disabled={isPending || !name.trim()}>
							{isPending
								? isEditing
									? "Saving..."
									: "Creating..."
								: isEditing
									? "Save Changes"
									: "Create Account"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
