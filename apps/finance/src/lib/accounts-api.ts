import { getSupabaseClient } from "@khufushome/auth";
import type { Account, AccountInsert, AccountUpdate } from "./types";

function supabase() {
	return getSupabaseClient();
}

export async function fetchAccounts(includeArchived = false): Promise<Account[]> {
	let query = supabase()
		.from("accounts")
		.select("*")
		.order("created_at", { ascending: true });

	if (!includeArchived) {
		query = query.eq("is_active", true);
	}

	const { data, error } = await query;
	if (error) throw error;
	return data as Account[];
}

export async function fetchAccount(id: string): Promise<Account> {
	const { data, error } = await supabase()
		.from("accounts")
		.select("*")
		.eq("id", id)
		.single();

	if (error) throw error;
	return data as Account;
}

export async function createAccount(account: AccountInsert): Promise<Account> {
	const { data: { user } } = await supabase().auth.getUser();
	if (!user) throw new Error("Not authenticated");

	const { data, error } = await supabase()
		.from("accounts")
		.insert({ ...account, user_id: user.id })
		.select()
		.single();

	if (error) throw error;
	return data as Account;
}

export async function updateAccount(
	id: string,
	updates: AccountUpdate,
): Promise<Account> {
	const { data, error } = await supabase()
		.from("accounts")
		.update(updates)
		.eq("id", id)
		.select()
		.single();

	if (error) throw error;
	return data as Account;
}

export async function archiveAccount(id: string): Promise<Account> {
	return updateAccount(id, { is_active: false });
}

export async function restoreAccount(id: string): Promise<Account> {
	return updateAccount(id, { is_active: true });
}

export async function deleteAccount(id: string): Promise<void> {
	const { error } = await supabase().from("accounts").delete().eq("id", id);
	if (error) throw error;
}
