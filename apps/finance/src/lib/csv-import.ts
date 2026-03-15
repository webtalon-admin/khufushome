import type { TransactionType } from "./types";

// ── CSV Parsing ───────────────────────────────────────────────

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
	const lines = text.split(/\r?\n/).filter((l) => l.trim());
	if (lines.length === 0) return { headers: [], rows: [] };

	const parse = (line: string): string[] => {
		const cells: string[] = [];
		let current = "";
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const ch = line[i]!;
			if (inQuotes) {
				if (ch === '"' && line[i + 1] === '"') {
					current += '"';
					i++;
				} else if (ch === '"') {
					inQuotes = false;
				} else {
					current += ch;
				}
			} else if (ch === '"') {
				inQuotes = true;
			} else if (ch === ",") {
				cells.push(current.trim());
				current = "";
			} else {
				current += ch;
			}
		}
		cells.push(current.trim());
		return cells;
	};

	const headers = parse(lines[0]!);
	const rows = lines.slice(1).map(parse).filter((r) => r.some((c) => c));
	return { headers, rows };
}

// ── Import Hash (SHA-256 of date+amount+description) ──────────

export async function computeImportHash(
	date: string,
	amount: number,
	description: string,
): Promise<string> {
	const input = `${date}|${amount}|${description}`;
	const encoded = new TextEncoder().encode(input);
	const buffer = await crypto.subtle.digest("SHA-256", encoded);
	const bytes = new Uint8Array(buffer);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

// ── Format Definitions ────────────────────────────────────────

export interface CsvColumnMapping {
	date: string;
	amount: string;
	description: string;
	category?: string;
	balance?: string;
}

export interface CsvFormatDef {
	id: string;
	label: string;
	institution: string;
	dateFormat: "DD/MM/YYYY" | "YYYY-MM-DD" | "MM/DD/YYYY" | "D/MM/YYYY";
	/** If true, positive = credit (income), negative = debit (expense).
	 *  If false, the sign is reversed. */
	positiveIsCredit: boolean;
	columns: CsvColumnMapping;
	skipRows?: number;
}

export const CSV_FORMATS: CsvFormatDef[] = [
	{
		id: "macquarie",
		label: "Macquarie Bank",
		institution: "Macquarie",
		dateFormat: "DD/MM/YYYY",
		positiveIsCredit: true,
		columns: {
			date: "Date",
			amount: "Amount",
			description: "Description",
			balance: "Balance",
		},
	},
	{
		id: "commbank",
		label: "Commonwealth Bank",
		institution: "CommBank",
		dateFormat: "DD/MM/YYYY",
		positiveIsCredit: true,
		columns: {
			date: "Date",
			amount: "Amount",
			description: "Description",
			balance: "Balance",
		},
	},
	{
		id: "westpac",
		label: "Westpac",
		institution: "Westpac",
		dateFormat: "DD/MM/YYYY",
		positiveIsCredit: true,
		columns: {
			date: "Date",
			amount: "Amount",
			description: "Narrative",
			balance: "Balance",
		},
	},
	{
		id: "anz",
		label: "ANZ",
		institution: "ANZ",
		dateFormat: "DD/MM/YYYY",
		positiveIsCredit: true,
		columns: {
			date: "Date",
			amount: "Amount",
			description: "Description",
		},
	},
	{
		id: "nab",
		label: "NAB",
		institution: "NAB",
		dateFormat: "DD/MM/YYYY",
		positiveIsCredit: true,
		columns: {
			date: "Date",
			amount: "Amount",
			description: "Description",
			balance: "Balance",
		},
	},
];

// ── Date Parsing ──────────────────────────────────────────────

export function parseDate(
	raw: string,
	format: CsvFormatDef["dateFormat"],
): string | null {
	const cleaned = raw.trim();
	if (!cleaned) return null;

	let day: number;
	let month: number;
	let year: number;

	if (format === "DD/MM/YYYY" || format === "D/MM/YYYY") {
		const parts = cleaned.split("/");
		if (parts.length !== 3) return null;
		day = Number(parts[0]);
		month = Number(parts[1]);
		year = Number(parts[2]);
	} else if (format === "MM/DD/YYYY") {
		const parts = cleaned.split("/");
		if (parts.length !== 3) return null;
		month = Number(parts[0]);
		day = Number(parts[1]);
		year = Number(parts[2]);
	} else {
		const parts = cleaned.split("-");
		if (parts.length !== 3) return null;
		year = Number(parts[0]);
		month = Number(parts[1]);
		day = Number(parts[2]);
	}

	if (
		Number.isNaN(day) ||
		Number.isNaN(month) ||
		Number.isNaN(year) ||
		day < 1 ||
		day > 31 ||
		month < 1 ||
		month > 12
	)
		return null;

	if (year < 100) year += 2000;
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ── Row → Transaction Mapping ─────────────────────────────────

export interface ParsedTransaction {
	date: string;
	amount: number;
	type: TransactionType;
	description: string;
	category: string;
	import_hash: string;
}

function findColumnIndex(headers: string[], target: string): number {
	const lower = target.toLowerCase();
	let idx = headers.findIndex((h) => h.toLowerCase() === lower);
	if (idx >= 0) return idx;
	idx = headers.findIndex((h) => h.toLowerCase().includes(lower));
	return idx;
}

export async function mapRowsToTransactions(
	headers: string[],
	rows: string[][],
	format: CsvFormatDef,
	columnOverrides?: Partial<CsvColumnMapping>,
): Promise<{
	transactions: ParsedTransaction[];
	errors: { row: number; message: string }[];
}> {
	const cols = { ...format.columns, ...columnOverrides };
	const dateIdx = findColumnIndex(headers, cols.date);
	const amountIdx = findColumnIndex(headers, cols.amount);
	const descIdx = findColumnIndex(headers, cols.description);
	const catIdx = cols.category ? findColumnIndex(headers, cols.category) : -1;

	if (dateIdx < 0 || amountIdx < 0 || descIdx < 0) {
		return {
			transactions: [],
			errors: [
				{
					row: 0,
					message: `Missing required columns. Need: "${cols.date}", "${cols.amount}", "${cols.description}". Found: ${headers.join(", ")}`,
				},
			],
		};
	}

	const transactions: ParsedTransaction[] = [];
	const errors: { row: number; message: string }[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i]!;
		const rawDate = row[dateIdx] ?? "";
		const rawAmount = row[amountIdx] ?? "";
		const rawDesc = row[descIdx] ?? "";

		const date = parseDate(rawDate, format.dateFormat);
		if (!date) {
			errors.push({ row: i + 2, message: `Invalid date: "${rawDate}"` });
			continue;
		}

		const amount = Number.parseFloat(rawAmount.replace(/[,$]/g, ""));
		if (Number.isNaN(amount) || amount === 0) {
			errors.push({
				row: i + 2,
				message: `Invalid amount: "${rawAmount}"`,
			});
			continue;
		}

		const description = rawDesc || "No description";
		const absAmount = Math.abs(amount);
		const isCredit = format.positiveIsCredit ? amount > 0 : amount < 0;
		const type: TransactionType = isCredit ? "income" : "expense";

		const category =
			catIdx >= 0 && row[catIdx]
				? row[catIdx]!
				: isCredit
					? "Other Income"
					: "Other Expense";

		const hash = await computeImportHash(date, absAmount, description);

		transactions.push({
			date,
			amount: absAmount,
			type,
			description,
			category,
			import_hash: hash,
		});
	}

	return { transactions, errors };
}

// ── Auto-detect Format ────────────────────────────────────────

export function autoDetectFormat(headers: string[]): CsvFormatDef | null {
	const lower = headers.map((h) => h.toLowerCase().trim());

	for (const fmt of CSV_FORMATS) {
		const cols = fmt.columns;
		const dateMatch = lower.some((h) => h === cols.date.toLowerCase());
		const amountMatch = lower.some((h) => h === cols.amount.toLowerCase());
		const descMatch = lower.some((h) => h === cols.description.toLowerCase());
		if (dateMatch && amountMatch && descMatch) return fmt;
	}

	return null;
}
