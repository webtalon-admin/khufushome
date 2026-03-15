import { getSupabaseClient } from "@khufushome/auth";
import type {
	BalanceSnapshot,
	BalanceSnapshotInsert,
	BalanceSnapshotUpdate,
	BtcPriceMonthly,
	Contribution,
	ContributionInsert,
	ContributionUpdate,
	FundAllocation,
	FundFee,
	FundReference,
	FundReturn,
	FundSwitch,
	FundSwitchInsert,
	PipelineLog,
	SuperAccount,
	SuperAccountInsert,
	YourSuperStatus,
} from "./super-types";

function supabase() {
	return getSupabaseClient();
}

// ── Super Accounts ────────────────────────────────────────

export async function fetchSuperAccounts(): Promise<SuperAccount[]> {
	const { data, error } = await supabase()
		.from("accounts")
		.select("*")
		.eq("type", "super")
		.order("is_active", { ascending: false })
		.order("created_at", { ascending: true });

	if (error) throw error;
	return data as SuperAccount[];
}

export async function createSuperAccount(
	input: SuperAccountInsert,
): Promise<SuperAccount> {
	const {
		data: { user },
	} = await supabase().auth.getUser();
	if (!user) throw new Error("Not authenticated");

	const { data, error } = await supabase()
		.from("accounts")
		.insert({
			user_id: user.id,
			name: input.name,
			type: "super",
			institution: input.institution ?? input.metadata.fund_name,
			is_active: true,
			metadata: input.metadata,
		})
		.select()
		.single();

	if (error) throw error;
	return data as SuperAccount;
}

export async function updateSuperAccount(
	id: string,
	input: Partial<SuperAccountInsert> & { is_active?: boolean },
): Promise<SuperAccount> {
	const updates: Record<string, unknown> = {};
	if (input.name !== undefined) updates.name = input.name;
	if (input.institution !== undefined) updates.institution = input.institution;
	if (input.metadata !== undefined) updates.metadata = input.metadata;
	if (input.is_active !== undefined) updates.is_active = input.is_active;

	const { data, error } = await supabase()
		.from("accounts")
		.update(updates)
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;
	return data as SuperAccount;
}

// ── Fund Switches ─────────────────────────────────────────

export async function fetchFundSwitches(): Promise<FundSwitch[]> {
	const { data, error } = await supabase()
		.from("super_fund_switches")
		.select("*")
		.order("switch_date", { ascending: false });

	if (error) throw error;
	return data as FundSwitch[];
}

export async function createFundSwitch(
	input: FundSwitchInsert,
): Promise<FundSwitch> {
	const {
		data: { user },
	} = await supabase().auth.getUser();
	if (!user) throw new Error("Not authenticated");

	const { data, error } = await supabase()
		.from("super_fund_switches")
		.insert({ ...input, user_id: user.id })
		.select()
		.single();

	if (error) throw error;
	return data as FundSwitch;
}

// ── Contributions ─────────────────────────────────────────

export async function fetchContributions(
	accountId?: string,
): Promise<Contribution[]> {
	let query = supabase()
		.from("super_contributions")
		.select("*")
		.order("date", { ascending: false });

	if (accountId) {
		query = query.eq("super_account_id", accountId);
	}

	const { data, error } = await query;
	if (error) throw error;
	return data as Contribution[];
}

export async function createContribution(
	input: ContributionInsert,
): Promise<Contribution> {
	const {
		data: { user },
	} = await supabase().auth.getUser();
	if (!user) throw new Error("Not authenticated");

	const { data, error } = await supabase()
		.from("super_contributions")
		.insert({ ...input, user_id: user.id })
		.select()
		.single();

	if (error) throw error;
	return data as Contribution;
}

export async function updateContribution(
	id: string,
	updates: ContributionUpdate,
): Promise<Contribution> {
	const { data, error } = await supabase()
		.from("super_contributions")
		.update(updates)
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;
	return data as Contribution;
}

export async function deleteContribution(id: string): Promise<void> {
	const { error } = await supabase()
		.from("super_contributions")
		.delete()
		.eq("id", id);
	if (error) throw error;
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

export async function fetchFundAllocations(): Promise<FundAllocation[]> {
	const { data, error } = await supabase()
		.from("super_fund_allocations")
		.select(
			"fund_id, australian_equities, international_equities, property, infrastructure, private_equity, alternatives, fixed_income, cash",
		);

	if (error) throw error;
	return data as FundAllocation[];
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

// ── YourSuper Status ──────────────────────────────────────

export async function fetchYourSuperStatus(
	fundId: string,
): Promise<YourSuperStatus | null> {
	const { data, error } = await supabase()
		.from("super_yoursuper_status")
		.select("*")
		.eq("fund_id", fundId)
		.order("data_date", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) throw error;
	return data as YourSuperStatus | null;
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
			"apra_saa",
			"apra_performance",
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

const INVOKE_TIMEOUT_MS = 120_000;

export async function invokeEdgeFunction(
	functionName: string,
): Promise<{ ok: boolean; error?: string }> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), INVOKE_TIMEOUT_MS);

	try {
		const { data, error } = await supabase().functions.invoke(functionName, {
			method: "POST",
			body: {},
			signal: controller.signal,
		});

		if (error) {
			return { ok: false, error: error.message };
		}

		return (data as { ok: boolean; error?: string }) ?? { ok: true };
	} catch (err) {
		if (err instanceof DOMException && err.name === "AbortError") {
			return { ok: false, error: "Request timed out (2 min)" };
		}
		return { ok: false, error: String(err) };
	} finally {
		clearTimeout(timer);
	}
}
