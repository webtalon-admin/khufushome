import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

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

		// Historical data (Oct 2020 - Mar 2026) is seeded via migration.
		// This function only fetches the last 90 days to pick up new months.
		// CoinGecko free tier allows up to 365 days of lookback.
		const url = `${COINGECKO_API}/coins/bitcoin/market_chart?vs_currency=aud&days=90&precision=2`;
		console.log("Fetching last 90 days of BTC/AUD prices from CoinGecko...");

		const response = await fetch(url);
		if (!response.ok) {
			const errText = await response.text();
			throw new Error(
				`CoinGecko API returned ${response.status}: ${errText.slice(0, 300)}`,
			);
		}

		const data: MarketChartResponse = await response.json();
		console.log(`Received ${data.prices.length} data points`);

		const monthlyPrices = extractMonthlyCloses(data.prices);
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
