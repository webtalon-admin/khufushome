export interface BalanceSnapshot {
	id: string;
	super_account_id: string;
	user_id: string;
	balance: number;
	recorded_date: string;
	employer_contribution: number | null;
	salary_sacrifice: number | null;
	member_fee: number | null;
	income_tax: number | null;
	insurance_premium: number | null;
	investment_return: number | null;
	created_at: string;
}

export interface BalanceSnapshotInsert {
	super_account_id: string;
	balance: number;
	recorded_date: string;
	employer_contribution?: number | null;
	salary_sacrifice?: number | null;
	member_fee?: number | null;
	income_tax?: number | null;
	insurance_premium?: number | null;
	investment_return?: number | null;
}

export type BalanceSnapshotUpdate = Partial<BalanceSnapshotInsert>;

export interface FundReference {
	id: string;
	name: string;
	option_name: string;
	fund_type: string;
}

export interface FundReturn {
	fund_id: string;
	fy: string;
	return_pct: number;
	return_type: string;
}

export interface FundFee {
	fund_id: string;
	admin_fee_flat: number;
	admin_fee_pct: number;
	investment_fee_pct: number;
	performance_fee_pct: number | null;
	transaction_cost_pct: number | null;
}

export interface FundAllocation {
	fund_id: string;
	australian_equities: number | null;
	international_equities: number | null;
	property: number | null;
	infrastructure: number | null;
	private_equity: number | null;
	alternatives: number | null;
	fixed_income: number | null;
	cash: number | null;
}

export const ASSET_CLASSES = [
	"australian_equities",
	"international_equities",
	"property",
	"infrastructure",
	"private_equity",
	"alternatives",
	"fixed_income",
	"cash",
] as const;

export type AssetClass = (typeof ASSET_CLASSES)[number];

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
	australian_equities: "AU Equities",
	international_equities: "Intl Equities",
	property: "Property",
	infrastructure: "Infrastructure",
	private_equity: "Private Equity",
	alternatives: "Alternatives",
	fixed_income: "Fixed Income",
	cash: "Cash",
};

export const GROWTH_ASSETS: AssetClass[] = [
	"australian_equities",
	"international_equities",
	"property",
	"infrastructure",
	"private_equity",
	"alternatives",
];

export const DEFENSIVE_ASSETS: AssetClass[] = ["fixed_income", "cash"];

export interface BtcPriceMonthly {
	price_date: string;
	btc_aud_close: number;
}

export interface WhatIfPoint {
	date: string;
	actual: number;
	[fundId: string]: number | string;
}

export interface SmsfBtcResult {
	snapshotValues: { date: string; audValue: number }[];
	totalBtc: number;
	totalContributedAud: number;
	currentAudValue: number;
	currentBtcPrice: number;
}

export const SMSF_DEFAULTS = {
	annualCost: 3318,
	exchangeFeePct: 0.005,
} as const;

// ── Super Accounts ────────────────────────────────────────

export interface SuperAccountMetadata {
	fund_name: string;
	fund_id?: string;
	member_number?: string;
	investment_option?: string;
	insurance_premiums_monthly?: number;
	admin_fee_monthly?: number;
}

// ── YourSuper Status ─────────────────────────────────────

export type YourSuperAssessment = "performing" | "underperforming" | "not_assessed";

export interface YourSuperStatus {
	id: string;
	fund_id: string;
	assessment: YourSuperAssessment;
	net_return_pa: number | null;
	fees_pa_on_50k: number | null;
	ranking: number | null;
	data_date: string;
	fetched_at: string;
}

export interface SuperAccount {
	id: string;
	user_id: string;
	name: string;
	type: "super";
	institution: string | null;
	is_active: boolean;
	metadata: SuperAccountMetadata;
	created_at: string;
	updated_at: string;
}

export interface SuperAccountInsert {
	name: string;
	institution?: string;
	metadata: SuperAccountMetadata;
}

export interface FundSwitch {
	id: string;
	user_id: string;
	from_account_id: string | null;
	to_account_id: string;
	switch_date: string;
	reason: string | null;
	balance_at_switch: number | null;
	created_at: string;
}

export interface FundSwitchInsert {
	from_account_id: string | null;
	to_account_id: string;
	switch_date: string;
	reason?: string;
	balance_at_switch?: number;
}

// ── Contributions ─────────────────────────────────────────

export const CONTRIBUTION_TYPES = [
	"employer_sg",
	"salary_sacrifice",
	"personal_concessional",
	"personal_non_concessional",
	"government_co_contribution",
] as const;

export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

export const CONTRIBUTION_TYPE_LABELS: Record<ContributionType, string> = {
	employer_sg: "Employer SG",
	salary_sacrifice: "Salary Sacrifice",
	personal_concessional: "Personal (Concessional)",
	personal_non_concessional: "Personal (Non-Concessional)",
	government_co_contribution: "Government Co-Contribution",
};

export const CONCESSIONAL_TYPES: ContributionType[] = [
	"employer_sg",
	"salary_sacrifice",
	"personal_concessional",
];

export interface Contribution {
	id: string;
	user_id: string;
	super_account_id: string;
	type: ContributionType;
	amount: number;
	date: string;
	financial_year: string;
	employer_name: string | null;
	notes: string | null;
	created_at: string;
}

export interface ContributionInsert {
	super_account_id: string;
	type: ContributionType;
	amount: number;
	date: string;
	financial_year: string;
	employer_name?: string;
	notes?: string;
}

export type ContributionUpdate = Partial<Omit<ContributionInsert, "super_account_id">>;

// ── Projections ──────────────────────────────────────────

export interface ProjectionYear {
	year: number;
	age: number;
	balance: number;
	contribution: number;
	grossReturn: number;
	fee: number;
	netReturn: number;
}

export interface ProjectionInput {
	fundId: string;
	label: string;
	annualReturnPct: number;
	feePct: number;
	feeFlat: number;
}

export interface PipelineLog {
	id: string;
	pipeline: string;
	status: "running" | "success" | "error";
	rows_upserted: number;
	error_message: string | null;
	source_date: string | null;
	started_at: string;
	completed_at: string | null;
}
