import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@khufushome/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	AlertCircle,
	ArrowDownRight,
	ArrowUpRight,
	CheckCircle2,
	FileUp,
	Info,
	Loader2,
	Upload,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { fetchAccounts } from "../../lib/accounts-api";
import {
	CSV_FORMATS,
	type CsvFormatDef,
	type ParsedTransaction,
	autoDetectFormat,
	mapRowsToTransactions,
	parseCsv,
} from "../../lib/csv-import";
import {
	type BulkImportResult,
	type BulkImportRow,
	bulkImportTransactions,
} from "../../lib/transactions-api";

type Step = "upload" | "configure" | "preview" | "result";

interface CsvImportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultAccountId?: string;
}

export function CsvImportDialog({
	open,
	onOpenChange,
	defaultAccountId,
}: CsvImportDialogProps) {
	const queryClient = useQueryClient();
	const { data: accounts } = useQuery({
		queryKey: ["accounts"],
		queryFn: () => fetchAccounts(false),
	});

	const [step, setStep] = useState<Step>("upload");
	const [fileName, setFileName] = useState("");
	const [headers, setHeaders] = useState<string[]>([]);
	const [rows, setRows] = useState<string[][]>([]);
	const [format, setFormat] = useState<CsvFormatDef | null>(null);
	const [accountId, setAccountId] = useState(defaultAccountId ?? "");
	const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
	const [parseErrors, setParseErrors] = useState<{ row: number; message: string }[]>([]);
	const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

	// Custom column mapping overrides for "generic" format
	const [colDate, setColDate] = useState("");
	const [colAmount, setColAmount] = useState("");
	const [colDesc, setColDesc] = useState("");
	const [dateFormat, setDateFormat] = useState<CsvFormatDef["dateFormat"]>("DD/MM/YYYY");

	const resetState = useCallback(() => {
		setStep("upload");
		setFileName("");
		setHeaders([]);
		setRows([]);
		setFormat(null);
		setAccountId(defaultAccountId ?? "");
		setParsed([]);
		setParseErrors([]);
		setImportResult(null);
		setColDate("");
		setColAmount("");
		setColDesc("");
		setDateFormat("DD/MM/YYYY");
	}, [defaultAccountId]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setFileName(file.name);

		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result as string;
			const { headers: h, rows: r } = parseCsv(text);
			setHeaders(h);
			setRows(r);

			const detected = autoDetectFormat(h);
			setFormat(detected);
			if (detected) {
				setColDate(detected.columns.date);
				setColAmount(detected.columns.amount);
				setColDesc(detected.columns.description);
				setDateFormat(detected.dateFormat);
			}
			setStep("configure");
		};
		reader.readAsText(file);
	};

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const file = e.dataTransfer.files[0];
			if (!file || !file.name.endsWith(".csv")) return;
			setFileName(file.name);

			const reader = new FileReader();
			reader.onload = (ev) => {
				const text = ev.target?.result as string;
				const { headers: h, rows: r } = parseCsv(text);
				setHeaders(h);
				setRows(r);

				const detected = autoDetectFormat(h);
				setFormat(detected);
				if (detected) {
					setColDate(detected.columns.date);
					setColAmount(detected.columns.amount);
					setColDesc(detected.columns.description);
					setDateFormat(detected.dateFormat);
				}
				setStep("configure");
			};
			reader.readAsText(file);
		},
		[],
	);

	const handleParse = async () => {
		const effectiveFormat: CsvFormatDef = format ?? {
			id: "generic",
			label: "Custom",
			institution: "",
			dateFormat,
			positiveIsCredit: true,
			columns: {
				date: colDate || "Date",
				amount: colAmount || "Amount",
				description: colDesc || "Description",
			},
		};

		const overrides = format
			? undefined
			: {
					date: colDate,
					amount: colAmount,
					description: colDesc,
				};

		const result = await mapRowsToTransactions(headers, rows, effectiveFormat, overrides);
		setParsed(result.transactions);
		setParseErrors(result.errors);
		setStep("preview");
	};

	const importMut = useMutation({
		mutationFn: async () => {
			if (!accountId) throw new Error("Select an account");
			const bulkRows: BulkImportRow[] = parsed.map((t) => ({
				account_id: accountId,
				amount: t.amount,
				type: t.type,
				category: t.category,
				description: t.description,
				date: t.date,
				import_hash: t.import_hash,
			}));
			return bulkImportTransactions(bulkRows);
		},
		onSuccess: (result) => {
			setImportResult(result);
			setStep("result");
			queryClient.invalidateQueries({ queryKey: ["transactions"] });
		},
	});

	const previewSlice = useMemo(() => parsed.slice(0, 20), [parsed]);

	const configValid = accountId && (format || (colDate && colAmount && colDesc));

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) resetState();
				onOpenChange(o);
			}}
		>
			<DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Import CSV</DialogTitle>
					<DialogDescription>
						{step === "upload" && "Upload a bank transaction CSV file."}
						{step === "configure" && "Configure format and column mapping."}
						{step === "preview" && `Preview ${parsed.length} transactions before importing.`}
						{step === "result" && "Import complete."}
					</DialogDescription>
				</DialogHeader>

				{/* Step 1: Upload */}
				{step === "upload" && (
				<div className="space-y-4">
					<div
						className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-10 text-center hover:border-primary/40 transition-colors cursor-pointer"
						onDragOver={(e) => e.preventDefault()}
						onDrop={handleDrop}
						onClick={() =>
							document.getElementById("csv-file-input")?.click()
						}
					>
						<Upload className="mb-3 size-10 text-muted-foreground" />
						<p className="text-sm font-medium text-foreground">
							Drop CSV file here or click to browse
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Supports Macquarie, CommBank, Westpac, ANZ, NAB, or custom format
						</p>
					<input
						id="csv-file-input"
						type="file"
						accept=".csv"
						className="hidden"
						onChange={handleFileChange}
					/>
				</div>

					<div className="rounded-lg border bg-muted/20 p-4 space-y-3">
						<div className="flex items-center gap-2">
							<Info className="size-4 text-primary shrink-0" />
							<p className="text-sm font-medium text-foreground">Expected CSV Format</p>
						</div>
						<div className="text-xs text-muted-foreground space-y-2">
							<p>Your CSV should have a header row with at least these 3 columns:</p>
							<div className="overflow-x-auto rounded border bg-background">
								<table className="w-full text-xs">
									<thead>
										<tr className="bg-muted/40">
											<th className="px-3 py-1.5 text-left font-semibold text-foreground">Column</th>
											<th className="px-3 py-1.5 text-left font-semibold text-foreground">Required</th>
											<th className="px-3 py-1.5 text-left font-semibold text-foreground">Type</th>
											<th className="px-3 py-1.5 text-left font-semibold text-foreground">Example</th>
										</tr>
									</thead>
									<tbody>
										<tr className="border-t border-border/50">
											<td className="px-3 py-1.5 font-medium text-foreground">Date</td>
											<td className="px-3 py-1.5"><Badge variant="default" className="text-[10px] px-1.5 py-0">Required</Badge></td>
											<td className="px-3 py-1.5">DD/MM/YYYY</td>
											<td className="px-3 py-1.5 font-mono">15/03/2026</td>
										</tr>
										<tr className="border-t border-border/50">
											<td className="px-3 py-1.5 font-medium text-foreground">Amount</td>
											<td className="px-3 py-1.5"><Badge variant="default" className="text-[10px] px-1.5 py-0">Required</Badge></td>
											<td className="px-3 py-1.5">Number (+ credit, − debit)</td>
											<td className="px-3 py-1.5 font-mono">-45.99</td>
										</tr>
										<tr className="border-t border-border/50">
											<td className="px-3 py-1.5 font-medium text-foreground">Description</td>
											<td className="px-3 py-1.5"><Badge variant="default" className="text-[10px] px-1.5 py-0">Required</Badge></td>
											<td className="px-3 py-1.5">Text</td>
											<td className="px-3 py-1.5 font-mono">Woolworths Town Hall</td>
										</tr>
										<tr className="border-t border-border/50">
											<td className="px-3 py-1.5 font-medium text-foreground">Balance</td>
											<td className="px-3 py-1.5"><Badge variant="outline" className="text-[10px] px-1.5 py-0">Optional</Badge></td>
											<td className="px-3 py-1.5">Number</td>
											<td className="px-3 py-1.5 font-mono">1,234.56</td>
										</tr>
										<tr className="border-t border-border/50">
											<td className="px-3 py-1.5 font-medium text-foreground">Category</td>
											<td className="px-3 py-1.5"><Badge variant="outline" className="text-[10px] px-1.5 py-0">Optional</Badge></td>
											<td className="px-3 py-1.5">Text</td>
											<td className="px-3 py-1.5 font-mono">Groceries</td>
										</tr>
									</tbody>
								</table>
							</div>
							<p className="text-[11px]">
								Column names are matched case-insensitively. If your bank uses different headers
								(e.g., "Narrative" instead of "Description"), you can map them manually in the next step.
								Positive amounts are treated as income, negative as expenses.
							</p>
						</div>
					</div>
				</div>
				)}

				{/* Step 2: Configure */}
				{step === "configure" && (
					<div className="space-y-4">
						<div className="flex items-center gap-2 rounded-md bg-muted/30 p-3">
							<FileUp className="size-4 text-muted-foreground" />
							<span className="text-sm text-foreground font-medium">{fileName}</span>
							<span className="text-xs text-muted-foreground">
								{rows.length} rows · {headers.length} columns
							</span>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium text-foreground">
								Account *
							</label>
							<select
								value={accountId}
								onChange={(e) => setAccountId(e.target.value)}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								required
							>
								<option value="">Select account…</option>
								{accounts?.map((a) => (
									<option key={a.id} value={a.id}>
										{a.name}
									</option>
								))}
							</select>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium text-foreground">
								Bank Format
							</label>
							<select
								value={format?.id ?? "generic"}
								onChange={(e) => {
									const f = CSV_FORMATS.find((f) => f.id === e.target.value);
									setFormat(f ?? null);
									if (f) {
										setColDate(f.columns.date);
										setColAmount(f.columns.amount);
										setColDesc(f.columns.description);
										setDateFormat(f.dateFormat);
									}
								}}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								{CSV_FORMATS.map((f) => (
									<option key={f.id} value={f.id}>
										{f.label}
									</option>
								))}
								<option value="generic">Custom / Other</option>
							</select>
							{format && (
								<p className="text-xs text-green-600 dark:text-green-400">
									Auto-detected: {format.label}
								</p>
							)}
						</div>

						{!format && (
							<div className="space-y-3 rounded-md border p-3">
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
									Custom Column Mapping
								</p>
								<div className="grid grid-cols-3 gap-3">
									<div className="space-y-1">
										<label className="text-xs text-foreground">Date Column *</label>
										<select
											value={colDate}
											onChange={(e) => setColDate(e.target.value)}
											className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										>
											<option value="">Select…</option>
											{headers.map((h) => (
												<option key={h} value={h}>{h}</option>
											))}
										</select>
									</div>
									<div className="space-y-1">
										<label className="text-xs text-foreground">Amount Column *</label>
										<select
											value={colAmount}
											onChange={(e) => setColAmount(e.target.value)}
											className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										>
											<option value="">Select…</option>
											{headers.map((h) => (
												<option key={h} value={h}>{h}</option>
											))}
										</select>
									</div>
									<div className="space-y-1">
										<label className="text-xs text-foreground">Description Column *</label>
										<select
											value={colDesc}
											onChange={(e) => setColDesc(e.target.value)}
											className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
										>
											<option value="">Select…</option>
											{headers.map((h) => (
												<option key={h} value={h}>{h}</option>
											))}
										</select>
									</div>
								</div>
								<div className="space-y-1">
									<label className="text-xs text-foreground">Date Format</label>
									<select
										value={dateFormat}
										onChange={(e) =>
											setDateFormat(e.target.value as CsvFormatDef["dateFormat"])
										}
										className="flex h-8 w-full max-w-[200px] rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
									>
										<option value="DD/MM/YYYY">DD/MM/YYYY</option>
										<option value="D/MM/YYYY">D/MM/YYYY</option>
										<option value="MM/DD/YYYY">MM/DD/YYYY</option>
										<option value="YYYY-MM-DD">YYYY-MM-DD</option>
									</select>
								</div>
							</div>
						)}

						{/* Raw preview */}
						<div className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								Raw Preview (first 5 rows)
							</p>
							<div className="overflow-x-auto rounded border text-xs">
								<table className="w-full">
									<thead>
										<tr className="bg-muted/30">
											{headers.map((h) => (
												<th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{rows.slice(0, 5).map((row, i) => (
											<tr key={i} className="border-t border-border/50">
												{row.map((cell, j) => (
													<td key={j} className="px-2 py-1 whitespace-nowrap text-foreground">
														{cell || "—"}
													</td>
												))}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={() => { resetState(); }}>
								Back
							</Button>
							<Button
								disabled={!configValid}
								onClick={handleParse}
							>
								Parse & Preview
							</Button>
						</DialogFooter>
					</div>
				)}

				{/* Step 3: Preview */}
				{step === "preview" && (
					<div className="space-y-4">
						<div className="flex items-center gap-3">
							<Badge variant="secondary" className="text-xs">
								{parsed.length} transactions
							</Badge>
							{parseErrors.length > 0 && (
								<Badge variant="destructive" className="text-xs">
									{parseErrors.length} errors
								</Badge>
							)}
						</div>

						{parseErrors.length > 0 && (
							<div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 space-y-1">
								<p className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
									<AlertCircle className="size-3.5" />
									Parse Errors (skipped rows)
								</p>
								<div className="max-h-24 overflow-y-auto space-y-0.5">
									{parseErrors.slice(0, 10).map((e) => (
										<p key={e.row} className="text-[11px] text-red-600 dark:text-red-400">
											Row {e.row}: {e.message}
										</p>
									))}
									{parseErrors.length > 10 && (
										<p className="text-[11px] text-red-500">
											…and {parseErrors.length - 10} more
										</p>
									)}
								</div>
							</div>
						)}

						{parsed.length > 0 && (
							<div className="overflow-x-auto rounded border text-xs">
								<table className="w-full">
									<thead>
										<tr className="bg-muted/30">
											<th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
											<th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
											<th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
											<th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
											<th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
										</tr>
									</thead>
									<tbody>
										{previewSlice.map((txn, i) => (
											<tr key={i} className="border-t border-border/50">
												<td className="px-3 py-1.5 whitespace-nowrap text-foreground">
													{new Date(txn.date).toLocaleDateString("en-AU", {
														day: "numeric",
														month: "short",
														year: "numeric",
													})}
												</td>
												<td className="px-3 py-1.5">
													<span className="flex items-center gap-1">
														{txn.type === "income" ? (
															<ArrowUpRight className="size-3 text-green-500" />
														) : (
															<ArrowDownRight className="size-3 text-red-500" />
														)}
														<span className="capitalize">{txn.type}</span>
													</span>
												</td>
												<td className="px-3 py-1.5 text-muted-foreground">{txn.category}</td>
												<td className="px-3 py-1.5 max-w-[250px] truncate text-foreground">
													{txn.description}
												</td>
												<td
													className={`px-3 py-1.5 text-right font-mono ${
														txn.type === "income"
															? "text-green-600 dark:text-green-400"
															: "text-red-600 dark:text-red-400"
													}`}
												>
													{txn.type === "income" ? "+" : "−"}$
													{txn.amount.toLocaleString("en-AU", {
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													})}
												</td>
											</tr>
										))}
									</tbody>
								</table>
								{parsed.length > 20 && (
									<p className="px-3 py-2 text-[11px] text-muted-foreground border-t">
										Showing first 20 of {parsed.length} transactions
									</p>
								)}
							</div>
						)}

						<DialogFooter>
							<Button variant="outline" onClick={() => setStep("configure")}>
								Back
							</Button>
							<Button
								disabled={parsed.length === 0 || importMut.isPending}
								onClick={() => importMut.mutate()}
							>
								{importMut.isPending ? (
									<>
										<Loader2 className="mr-1.5 size-4 animate-spin" />
										Importing…
									</>
								) : (
									<>
										<FileUp className="mr-1.5 size-4" />
										Import {parsed.length} Transactions
									</>
								)}
							</Button>
						</DialogFooter>
					</div>
				)}

				{/* Step 4: Result */}
				{step === "result" && importResult && (
					<div className="space-y-4">
						<div className="flex flex-col items-center py-6">
							<CheckCircle2 className="size-12 text-green-500 mb-3" />
							<p className="text-lg font-semibold text-foreground">
								Import Complete
							</p>
						</div>

						<div className="grid grid-cols-3 gap-3">
							<div className="rounded-md border p-3 text-center">
								<p className="text-2xl font-bold text-green-600 dark:text-green-400">
									{importResult.inserted}
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">Imported</p>
							</div>
							<div className="rounded-md border p-3 text-center">
								<p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
									{importResult.duplicates}
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">Duplicates Skipped</p>
							</div>
							<div className="rounded-md border p-3 text-center">
								<p className="text-2xl font-bold text-red-600 dark:text-red-400">
									{importResult.errors.length}
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">Errors</p>
							</div>
						</div>

						{importResult.errors.length > 0 && (
							<div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3">
								{importResult.errors.map((err, i) => (
									<p key={i} className="text-xs text-red-600 dark:text-red-400">
										{err}
									</p>
								))}
							</div>
						)}

						<DialogFooter>
							<Button
								onClick={() => {
									resetState();
									onOpenChange(false);
								}}
							>
								Done
							</Button>
						</DialogFooter>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
