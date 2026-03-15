import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ATO_API_URL = "https://www.ato.gov.au/api/v1/YourSuper/APRAData";

interface ATOSubProduct {
	lifeCycleStageName?: string;
	fundNetReturnLastTenYearsPercentageNumber?: number | null;
	fundNetReturnLastNineYearsPercentageNumber?: number | null;
	fundNetReturnLastFiveYearsPercentageNumber?: number | null;
	fundNetReturnLastThreeYearsPercentageNumber?: number | null;
	privateFundIndicator?: string;
	adminFeesDisclosedAmount?: number;
	investmentFeesDisclosedAmount?: number;
	totalFeesDisclosedAmount?: number;
	riskLevelCode?: string;
	internetURLAddress?: string;
	superannuationFundInvestmentStrategyTypeCode?: string;
	superannuationProductSubproductID?: number;
}

interface ATOProduct {
	performanceRatingCode: string;
	superannuationProviderDetailFundName: string;
	superannuationProviderProductName: string;
	subProduct: ATOSubProduct[];
}

interface ATOApiResponse {
	processMessages: unknown[];
	response: {
		apraDataFileUploadDate: string;
		fundProduct: ATOProduct[];
	};
}

// Our tracked fund ABNs and name patterns, matching config.py.
// The ATO API doesn't return ABNs, so we match on fund + product name.
// YourSuper API only lists MySuper products (mandatory default option per fund).
// We match on fund name; product_patterns use "mysuper" since that's how they're named.
// Funds without a MySuper product in the API (Future Super, Hostplus Shares Plus) are excluded.
const FUND_MATCHERS: {
	fund_id: string;
	fund_patterns: string[];
	product_patterns: string[];
}[] = [
	{
		fund_id: "australian_super",
		fund_patterns: ["australiansuper"],
		product_patterns: ["mysuper"],
	},
	{
		fund_id: "hostplus_balanced",
		fund_patterns: ["hostplus"],
		product_patterns: ["mysuper"],
	},
	{
		fund_id: "unisuper",
		fund_patterns: ["unisuper"],
		product_patterns: ["mysuper"],
	},
	{
		fund_id: "art_high_growth",
		fund_patterns: ["australian retirement trust"],
		product_patterns: ["lifecycle"],
	},
	{
		fund_id: "aware_super",
		fund_patterns: ["aware super"],
		product_patterns: ["mysuper"],
	},
	{
		fund_id: "hesta_high_growth",
		fund_patterns: ["hesta"],
		product_patterns: ["mysuper"],
	},
	{
		fund_id: "rest_super",
		fund_patterns: ["retail employees superannuation"],
		product_patterns: ["mysuper"],
	},
	{
		fund_id: "vanguard_super",
		fund_patterns: ["vanguard"],
		product_patterns: ["mysuper"],
	},
];

function matchFundId(
	fundName: string,
	productName: string,
): string | null {
	const fundLower = fundName.toLowerCase();
	const productLower = productName.toLowerCase();

	for (const matcher of FUND_MATCHERS) {
		const fundMatch = matcher.fund_patterns.some((p) => fundLower.includes(p));
		if (!fundMatch) continue;

		const productMatch = matcher.product_patterns.some((p) =>
			productLower.includes(p),
		);
		if (productMatch) return matcher.fund_id;
	}
	return null;
}

function mapAssessment(
	code: string,
): "performing" | "underperforming" | "not_assessed" {
	const lower = code.toLowerCase();
	if (lower === "performing" || lower === "pass") return "performing";
	if (lower === "underperforming" || lower === "fail") return "underperforming";
	return "not_assessed";
}

Deno.serve(async (req) => {
	try {
		const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
		const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
		const sb = createClient(supabaseUrl, serviceRoleKey);

		const startedAt = new Date().toISOString();
		await sb.from("data_pipeline_logs").insert({
			pipeline: "yoursuper_refresh",
			status: "running",
			started_at: startedAt,
		});

		// Fetch all products at $50k balance (matches our fees_pa_on_50k column)
		const params = new URLSearchParams({
			balance: "50000",
			amountRange: "9999",
		});
		const response = await fetch(`${ATO_API_URL}?${params}`);
		if (!response.ok) {
			const errText = await response.text();
			throw new Error(
				`ATO API returned ${response.status}: ${errText.slice(0, 200)}`,
			);
		}

		const body: ATOApiResponse = await response.json();
		const products = body.response.fundProduct;
		console.log(
			`Fetched ${products.length} products from ATO YourSuper API (data date: ${body.response.apraDataFileUploadDate})`,
		);

		const dataDate = body.response.apraDataFileUploadDate;
		const rows: Record<string, unknown>[] = [];
		const matched = new Set<string>();

		for (const product of products) {
			const fundId = matchFundId(
				product.superannuationProviderDetailFundName,
				product.superannuationProviderProductName,
			);
			if (!fundId || matched.has(fundId)) continue;

			const sub = product.subProduct?.[0];
			const netReturn =
				sub?.fundNetReturnLastTenYearsPercentageNumber ??
				sub?.fundNetReturnLastNineYearsPercentageNumber ??
				sub?.fundNetReturnLastFiveYearsPercentageNumber ??
				sub?.fundNetReturnLastThreeYearsPercentageNumber ??
				null;

			rows.push({
				fund_id: fundId,
				assessment: mapAssessment(product.performanceRatingCode),
				net_return_pa: netReturn,
				fees_pa_on_50k: sub?.totalFeesDisclosedAmount ?? null,
				ranking: null,
				data_date: dataDate,
			});
			matched.add(fundId);
		}

		console.log(`Matched ${rows.length} of ${FUND_MATCHERS.length} tracked funds`);
		if (matched.size < FUND_MATCHERS.length) {
			const missing = FUND_MATCHERS.filter((m) => !matched.has(m.fund_id)).map(
				(m) => m.fund_id,
			);
			console.log(`Unmatched funds: ${missing.join(", ")}`);
		}

		if (rows.length > 0) {
			const { error } = await sb
				.from("super_yoursuper_status")
				.upsert(rows, { onConflict: "fund_id,data_date" });
			if (error) throw new Error(`Supabase upsert error: ${error.message}`);
		}

		await sb.from("data_pipeline_logs").insert({
			pipeline: "yoursuper_refresh",
			status: "success",
			rows_upserted: rows.length,
			source_date: dataDate,
			started_at: startedAt,
			completed_at: new Date().toISOString(),
		});

		return new Response(
			JSON.stringify({
				ok: true,
				matched: rows.length,
				total_products: products.length,
				data_date: dataDate,
				funds: rows.map((r) => ({
					fund_id: r.fund_id,
					assessment: r.assessment,
					net_return_pa: r.net_return_pa,
					fees_pa_on_50k: r.fees_pa_on_50k,
				})),
			}),
			{ headers: { "Content-Type": "application/json" }, status: 200 },
		);
	} catch (err) {
		console.error("YourSuper refresh failed:", err);

		try {
			const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
			const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
			const sb = createClient(supabaseUrl, serviceRoleKey);
			await sb.from("data_pipeline_logs").insert({
				pipeline: "yoursuper_refresh",
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
