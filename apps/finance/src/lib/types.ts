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
