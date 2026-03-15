import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const COINGECKO_API = "https://api.coingecko.com/api/v3";
const EARLIEST_DATE = "2021-01-01";
const CHUNK_DAYS = 365;
const DELAY_BETWEEN_CHUNKS_MS = 1500;

interface MarketChartResponse {
	prices: [number, number][]; // [timestamp_ms, price]
}

function monthStart(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function extractMonthlyCloses(
	prices: [number, number][],
): { month: string; btc_aud_close: number }[] {
	const byMonth = new Map<string, number>();

	for (const [ts, price] of prices) {
		const d = new Date(ts);
		const key = monthStart(d);
		byMonth.set(key, price);
	}

	return Array.from(byMonth.entries())
		.map(([month, price]) => ({
			month,
			btc_aud_close: Math.round(price * 100) / 100,
		}))
		.sort((a, b) => a.month.localeCompare(b.month));
}

function addDays(d: Date, n: number): Date {
	const result = new Date(d);
	result.setDate(result.getDate() + n);
	return result;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchChunk(
	from: Date,
	to: Date,
): Promise<[number, number][]> {
	const fromTs = Math.floor(from.getTime() / 1000);
	const toTs = Math.floor(to.getTime() / 1000);
	const url = `${COINGECKO_API}/coins/bitcoin/market_chart/range?vs_currency=aud&from=${fromTs}&to=${toTs}`;

	const response = await fetch(url);
	if (!response.ok) {
		const errText = await response.text();
		throw new Error(
			`CoinGecko API returned ${response.status}: ${errText.slice(0, 300)}`,
		);
	}

	const data: MarketChartResponse = await response.json();
	return data.prices;
}

Deno.serve(async (_req) => {
	try {
		const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
		const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
		const sb = createClient(supabaseUrl, serviceRoleKey);

		const startedAt = new Date().toISOString();
		await sb.from("data_pipeline_logs").insert({
			pipeline: "btc_price_refresh",
			status: "running",
			started_at: startedAt,
		});

		// Delta logic: check the latest month already stored
		const { data: latest } = await sb
			.from("btc_price_monthly")
			.select("month")
			.order("month", { ascending: false })
			.limit(1)
			.single();

		let fetchFrom: Date;
		if (latest?.month) {
			// Start from the 1st of the month after the latest stored month
			const lastStored = new Date(`${latest.month}T00:00:00Z`);
			lastStored.setMonth(lastStored.getMonth() + 1);
			fetchFrom = lastStored;
			console.log(
				`Delta mode: latest stored month is ${latest.month}, fetching from ${fetchFrom.toISOString().split("T")[0]}`,
			);
		} else {
			fetchFrom = new Date(`${EARLIEST_DATE}T00:00:00Z`);
			console.log(
				`Initial backfill: no data found, fetching from ${EARLIEST_DATE}`,
			);
		}

		const fetchTo = new Date();

		if (fetchFrom >= fetchTo) {
			console.log("Already up to date, nothing to fetch.");
			await sb.from("data_pipeline_logs").insert({
				pipeline: "btc_price_refresh",
				status: "success",
				rows_upserted: 0,
				started_at: startedAt,
				completed_at: new Date().toISOString(),
			});
			return new Response(
				JSON.stringify({ ok: true, months: 0, message: "Already up to date" }),
				{ headers: { "Content-Type": "application/json" }, status: 200 },
			);
		}

		// Chunk the range into <=365-day windows to respect CoinGecko free tier limits
		const allPrices: [number, number][] = [];
		let chunkStart = fetchFrom;
		let chunkNum = 0;

		while (chunkStart < fetchTo) {
			const chunkEnd = new Date(
				Math.min(addDays(chunkStart, CHUNK_DAYS).getTime(), fetchTo.getTime()),
			);
			chunkNum++;

			console.log(
				`Chunk ${chunkNum}: ${chunkStart.toISOString().split("T")[0]} -> ${chunkEnd.toISOString().split("T")[0]}`,
			);

			const prices = await fetchChunk(chunkStart, chunkEnd);
			allPrices.push(...prices);
			console.log(`  Received ${prices.length} data points`);

			chunkStart = addDays(chunkEnd, 1);

			// Rate-limit: pause between chunks to avoid 429s on the free tier
			if (chunkStart < fetchTo) {
				await sleep(DELAY_BETWEEN_CHUNKS_MS);
			}
		}

		console.log(
			`Total: ${allPrices.length} data points across ${chunkNum} chunk(s)`,
		);

		const monthlyPrices = extractMonthlyCloses(allPrices);
		console.log(
			`Extracted ${monthlyPrices.length} monthly close prices (${monthlyPrices[0]?.month} to ${monthlyPrices.at(-1)?.month})`,
		);

		if (monthlyPrices.length > 0) {
			const rows = monthlyPrices.map((p) => ({
				...p,
				source: "coingecko",
			}));
			const { error } = await sb
				.from("btc_price_monthly")
				.upsert(rows, { onConflict: "month" });
			if (error) throw new Error(`Supabase upsert error: ${error.message}`);
		}

		await sb.from("data_pipeline_logs").insert({
			pipeline: "btc_price_refresh",
			status: "success",
			rows_upserted: monthlyPrices.length,
			started_at: startedAt,
			completed_at: new Date().toISOString(),
		});

		return new Response(
			JSON.stringify({
				ok: true,
				months: monthlyPrices.length,
				chunks: chunkNum,
				mode: latest?.month ? "delta" : "backfill",
				range: {
					from: monthlyPrices[0]?.month,
					to: monthlyPrices.at(-1)?.month,
				},
			}),
			{ headers: { "Content-Type": "application/json" }, status: 200 },
		);
	} catch (err) {
		console.error("BTC price refresh failed:", err);

		try {
			const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
			const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
			const sb = createClient(supabaseUrl, serviceRoleKey);
			await sb.from("data_pipeline_logs").insert({
				pipeline: "btc_price_refresh",
				status: "error",
				error_message: String(err).slice(0, 500),
				started_at: new Date().toISOString(),
				completed_at: new Date().toISOString(),
			});
		} catch {
			// best-effort logging
		}

		return new Response(
			JSON.stringify({ ok: false, error: String(err) }),
			{ headers: { "Content-Type": "application/json" }, status: 500 },
		);
	}
});
