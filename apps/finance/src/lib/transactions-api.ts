import { getSupabaseClient } from "@khufushome/auth";
import type {
	Transaction,
	TransactionInsert,
	TransactionUpdate,
} from "./types";

function supabase() {
	return getSupabaseClient();
}

export interface TransactionFilters {
	accountId?: string;
	type?: string;
	category?: string;
	dateFrom?: string;
	dateTo?: string;
	search?: string;
}

export async function fetchTransactions(
	filters: TransactionFilters = {},
	limit = 100,
	offset = 0,
): Promise<{ data: Transaction[]; count: number }> {
	let query = supabase()
		.from("transactions")
		.select("*", { count: "exact" })
		.order("date", { ascending: false })
		.order("created_at", { ascending: false })
		.range(offset, offset + limit - 1);

	if (filters.accountId) query = query.eq("account_id", filters.accountId);
	if (filters.type) query = query.eq("type", filters.type);
	if (filters.category) query = query.eq("category", filters.category);
	if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
	if (filters.dateTo) query = query.lte("date", filters.dateTo);
	if (filters.search)
		query = query.or(
			`description.ilike.%${filters.search}%,category.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`,
		);

	const { data, error, count } = await query;
	if (error) throw error;
	return { data: data as Transaction[], count: count ?? 0 };
}

export async function fetchTransaction(id: string): Promise<Transaction> {
	const { data, error } = await supabase()
		.from("transactions")
		.select("*")
		.eq("id", id)
		.single();
	if (error) throw error;
	return data as Transaction;
}

export async function createTransaction(
	txn: TransactionInsert,
): Promise<Transaction> {
	const {
		data: { user },
	} = await supabase().auth.getUser();
	if (!user) throw new Error("Not authenticated");

	const { data, error } = await supabase()
		.from("transactions")
		.insert({ ...txn, user_id: user.id })
		.select()
		.single();
	if (error) throw error;
	return data as Transaction;
}

export async function updateTransaction(
	id: string,
	updates: TransactionUpdate,
): Promise<Transaction> {
	const { data, error } = await supabase()
		.from("transactions")
		.update(updates)
		.eq("id", id)
		.select()
		.single();
	if (error) throw error;
	return data as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
	const { error } = await supabase()
		.from("transactions")
		.delete()
		.eq("id", id);
	if (error) throw error;
}

export async function fetchDistinctCategories(): Promise<string[]> {
	const { data, error } = await supabase()
		.from("transactions")
		.select("category")
		.order("category");
	if (error) throw error;
	const unique = [...new Set((data as { category: string }[]).map((r) => r.category))];
	return unique;
}

// ── Bulk Import (with dedup via import_hash) ──────────────────

export interface BulkImportRow {
	account_id: string;
	amount: number;
	type: string;
	category: string;
	description: string | null;
	date: string;
	import_hash: string;
}

export interface BulkImportResult {
	inserted: number;
	duplicates: number;
	errors: string[];
}

export async function fetchExistingHashes(
	hashes: string[],
): Promise<Set<string>> {
	if (hashes.length === 0) return new Set();
	const { data, error } = await supabase()
		.from("transactions")
		.select("import_hash")
		.in("import_hash", hashes);
	if (error) throw error;
	return new Set(
		(data as { import_hash: string | null }[])
			.map((r) => r.import_hash)
			.filter(Boolean) as string[],
	);
}

const BATCH_SIZE = 100;

export async function bulkImportTransactions(
	rows: BulkImportRow[],
): Promise<BulkImportResult> {
	const {
		data: { user },
	} = await supabase().auth.getUser();
	if (!user) throw new Error("Not authenticated");

	const allHashes = rows.map((r) => r.import_hash);
	const existing = await fetchExistingHashes(allHashes);

	const toInsert: BulkImportRow[] = [];
	let duplicates = 0;
	for (const row of rows) {
		if (existing.has(row.import_hash)) {
			duplicates++;
		} else {
			toInsert.push(row);
			existing.add(row.import_hash);
		}
	}

	const errors: string[] = [];
	let inserted = 0;

	for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
		const batch = toInsert.slice(i, i + BATCH_SIZE).map((r) => ({
			...r,
			user_id: user.id,
		}));

		const { error } = await supabase().from("transactions").insert(batch);
		if (error) {
			errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
		} else {
			inserted += batch.length;
		}
	}

	return { inserted, duplicates, errors };
}
