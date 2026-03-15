export const ACCOUNT_TYPES = [
	"checking",
	"savings",
	"credit_card",
	"investment",
	"crypto_exchange",
	"super",
	"offset",
	"loan",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
	checking: "Checking",
	savings: "Savings",
	credit_card: "Credit Card",
	investment: "Investment",
	crypto_exchange: "Crypto Exchange",
	super: "Superannuation",
	offset: "Offset",
	loan: "Loan",
};

export interface Account {
	id: string;
	user_id: string;
	name: string;
	type: AccountType;
	institution: string | null;
	currency: string;
	is_active: boolean;
	metadata: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}

export interface AccountInsert {
	name: string;
	type: AccountType;
	institution?: string | null;
	currency?: string;
	metadata?: Record<string, unknown>;
}

export interface AccountUpdate {
	name?: string;
	type?: AccountType;
	institution?: string | null;
	currency?: string;
	is_active?: boolean;
	metadata?: Record<string, unknown>;
}

// ── Transactions ──────────────────────────────────────────────

export const TRANSACTION_TYPES = ["income", "expense", "transfer"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
	income: "Income",
	expense: "Expense",
	transfer: "Transfer",
};

export const DEFAULT_CATEGORIES: Record<TransactionType, string[]> = {
	income: [
		"Salary",
		"Freelance",
		"Dividends",
		"Interest",
		"Refund",
		"Government",
		"Gift",
		"Other Income",
	],
	expense: [
		"Groceries",
		"Dining Out",
		"Transport",
		"Fuel",
		"Rent",
		"Mortgage",
		"Utilities",
		"Insurance",
		"Healthcare",
		"Entertainment",
		"Shopping",
		"Subscriptions",
		"Education",
		"Travel",
		"Personal Care",
		"Gifts & Donations",
		"Fees & Charges",
		"Tax",
		"Other Expense",
	],
	transfer: ["Internal Transfer", "Savings Transfer", "Investment Transfer", "Other Transfer"],
};

export interface Transaction {
	id: string;
	user_id: string;
	account_id: string;
	amount: number;
	type: TransactionType;
	category: string;
	subcategory: string | null;
	description: string | null;
	date: string;
	is_recurring: boolean;
	recurrence_rule: string | null;
	import_hash: string | null;
	tags: string[];
	notes: string | null;
	created_at: string;
}

export interface TransactionInsert {
	account_id: string;
	amount: number;
	type: TransactionType;
	category: string;
	subcategory?: string | null;
	description?: string | null;
	date: string;
	is_recurring?: boolean;
	recurrence_rule?: string | null;
	tags?: string[];
	notes?: string | null;
}

export interface TransactionUpdate {
	account_id?: string;
	amount?: number;
	type?: TransactionType;
	category?: string;
	subcategory?: string | null;
	description?: string | null;
	date?: string;
	is_recurring?: boolean;
	recurrence_rule?: string | null;
	tags?: string[];
	notes?: string | null;
}
