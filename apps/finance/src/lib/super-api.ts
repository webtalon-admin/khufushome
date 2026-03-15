import { getSupabaseClient } from "@khufushome/auth";
import type {
	BalanceSnapshot,
	BalanceSnapshotInsert,
	BalanceSnapshotUpdate,
	BtcPriceMonthly,
	FundFee,
	FundReference,
	FundReturn,
	PipelineLog,
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
		.select("price_date, btc_aud_close")
		.order("price_date");

	if (error) throw error;
	return data as BtcPriceMonthly[];
}

// ── Pipeline Logs ──────────────────────────────────────────

export async function fetchLatestPipelineLogs(): Promise<
	Record<string, PipelineLog>
> {
	const { data, error } = await supabase()
		.from("data_pipeline_logs")
		.select("*")
		.in("pipeline", [
			"yoursuper_refresh",
			"btc_price_refresh",
			"apra_ingest",
		])
		.order("started_at", { ascending: false });

	if (error) throw error;

	const latest: Record<string, PipelineLog> = {};
	for (const row of data as PipelineLog[]) {
		if (!latest[row.pipeline]) {
			latest[row.pipeline] = row;
		}
	}
	return latest;
}

// ── Edge Function Invocation ───────────────────────────────

export async function invokeEdgeFunction(
	functionName: string,
): Promise<{ ok: boolean; error?: string }> {
	const { data, error } = await supabase().functions.invoke(functionName, {
		method: "POST",
	});

	if (error) {
		return { ok: false, error: error.message };
	}

	return (data as { ok: boolean; error?: string }) ?? { ok: true };
}
