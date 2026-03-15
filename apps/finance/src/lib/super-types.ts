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
