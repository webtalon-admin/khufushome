import { getSupabaseClient } from "@khufushome/auth";
import type {
	BalanceSnapshot,
	BalanceSnapshotInsert,
	BalanceSnapshotUpdate,
	BtcPriceMonthly,
	FundFee,
	FundReference,
	FundReturn,
} from "./super-types";

function supabase() {
	return getSupabaseClient();
}

// ── Balance Snapshots ──────────────────────────────────────

export async function fetchSnapshots(): Promise<BalanceSnapshot[]> {
	const { data, error } = await supabase()
		.from("super_balance_history")
		.select("*")
		.order("recorded_date", { ascending: true });

	if (error) throw error;
	return data as BalanceSnapshot[];
}

export async function createSnapshot(
	snapshot: BalanceSnapshotInsert,
): Promise<BalanceSnapshot> {
	const {
		data: { user },
	} = await supabase().auth.getUser();
	if (!user) throw new Error("Not authenticated");

	const { data, error } = await supabase()
		.from("super_balance_history")
		.insert({ ...snapshot, user_id: user.id })
		.select()
		.single();

	if (error) throw error;
	return data as BalanceSnapshot;
}

export async function updateSnapshot(
	id: string,
	updates: BalanceSnapshotUpdate,
): Promise<BalanceSnapshot> {
	const { data, error } = await supabase()
		.from("super_balance_history")
		.update(updates)
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;
	return data as BalanceSnapshot;
}

export async function deleteSnapshot(id: string): Promise<void> {
	const { error } = await supabase()
		.from("super_balance_history")
		.delete()
		.eq("id", id);
	if (error) throw error;
}

// ── Fund Reference Data ────────────────────────────────────

export async function fetchFundReferences(): Promise<FundReference[]> {
	const { data, error } = await supabase()
		.from("super_fund_reference")
		.select("id, name, option_name, fund_type")
		.order("name");

	if (error) throw error;
	return data as FundReference[];
}

export async function fetchFundReturns(
	returnType?: string,
): Promise<FundReturn[]> {
	let query = supabase()
		.from("super_fund_returns")
		.select("fund_id, fy, return_pct, return_type")
		.order("fy");

	if (returnType) {
		query = query.eq("return_type", returnType);
	}

	const { data, error } = await query;
	if (error) throw error;
	return data as FundReturn[];
}

export async function fetchFundFees(): Promise<FundFee[]> {
	const { data, error } = await supabase()
		.from("super_fund_fees")
		.select(
			"fund_id, admin_fee_flat, admin_fee_pct, investment_fee_pct, performance_fee_pct, transaction_cost_pct",
		);

	if (error) throw error;
	return data as FundFee[];
}

// ── BTC Prices ─────────────────────────────────────────────

export async function fetchBtcPrices(): Promise<BtcPriceMonthly[]> {
	const { data, error } = await supabase()
		.from("btc_price_monthly")
		.select("month, btc_aud_close")
		.order("month");

	if (error) throw error;
	return data as BtcPriceMonthly[];
}
