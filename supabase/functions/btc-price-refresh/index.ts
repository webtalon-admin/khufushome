import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const COINGECKO_API = "https://api.coingecko.com/api/v3";

interface MarketChartResponse {
	prices: [number, number][]; // [timestamp_ms, price]
}

function dateKey(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function extractPricesForDates(
	prices: [number, number][],
): { price_date: string; btc_aud_close: number }[] {
	// Extract the closest price to the 1st and 15th of each month
	const byDate = new Map<string, number>();

	for (const [ts, price] of prices) {
		const d = new Date(ts);
		const day = d.getDate();
		const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

		// Closest to 1st: use days 1-3
		if (day >= 1 && day <= 3) {
			const key = `${ym}-01`;
			byDate.set(key, price);
		}
		// Closest to 15th: use days 14-16
		if (day >= 14 && day <= 16) {
			const key = `${ym}-15`;
			byDate.set(key, price);
		}
	}

	return Array.from(byDate.entries())
		.map(([price_date, price]) => ({
			price_date,
			btc_aud_close: Math.round(price * 100) / 100,
		}))
		.sort((a, b) => a.price_date.localeCompare(b.price_date));
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
		// This function fetches the last 90 days to pick up new 1st/15th prices.
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

		const monthlyPrices = extractPricesForDates(data.prices);
		console.log(
			`Extracted ${monthlyPrices.length} prices (1st+15th) (${monthlyPrices[0]?.price_date} to ${monthlyPrices.at(-1)?.price_date})`,
		);

		if (monthlyPrices.length > 0) {
			const rows = monthlyPrices.map((p) => ({
				...p,
				source: "coingecko",
			}));
			const { error } = await sb
				.from("btc_price_monthly")
				.upsert(rows, { onConflict: "price_date" });
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
				prices: monthlyPrices.length,
				range: {
					from: monthlyPrices[0]?.price_date,
					to: monthlyPrices.at(-1)?.price_date,
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
