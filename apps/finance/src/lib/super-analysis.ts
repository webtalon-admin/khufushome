import type {
	BalanceSnapshot,
	BtcPriceMonthly,
	FundFee,
	FundReturn,
	SmsfBtcResult,
	WhatIfPoint,
} from "./super-types";

// ── Helpers ────────────────────────────────────────────────

function dateToQuarterKey(d: Date): string {
	const q = Math.floor(d.getMonth() / 3) + 1;
	return `${d.getFullYear()}-Q${q}`;
}

function parseDate(s: string): Date {
	return new Date(`${s}T00:00:00`);
}

function monthsBetween(a: Date, b: Date): number {
	return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function addMonths(d: Date, n: number): Date {
	const result = new Date(d);
	result.setMonth(result.getMonth() + n);
	return result;
}

function dateKey(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Build a lookup: fund_id -> quarter_key -> return_pct
 * Only includes quarterly_net returns.
 */
function buildReturnLookup(
	returns: FundReturn[],
): Map<string, Map<string, number>> {
	const lookup = new Map<string, Map<string, number>>();
	for (const r of returns) {
		if (r.return_type !== "quarterly_net") continue;
		let fundMap = lookup.get(r.fund_id);
		if (!fundMap) {
			fundMap = new Map();
			lookup.set(r.fund_id, fundMap);
		}
		fundMap.set(r.fy, r.return_pct);
	}
	return lookup;
}

/**
 * Resolve the quarterly return for a fund between two dates.
 * If both dates fall in the same quarter, use that quarter's return pro-rated.
 * If they span multiple quarters, compound all quarterly returns in the range.
 */
function resolveQuarterlyReturn(
	fundReturns: Map<string, number> | undefined,
	startDate: Date,
	endDate: Date,
): number {
	if (!fundReturns) return 0;

	const startQ = dateToQuarterKey(startDate);
	const endQ = dateToQuarterKey(endDate);

	if (startQ === endQ) {
		return fundReturns.get(startQ) ?? 0;
	}

	// Compound all quarters from start to end
	let compounded = 1;
	const current = new Date(startDate);
	const quarters = new Set<string>();

	while (current <= endDate) {
		const qKey = dateToQuarterKey(current);
		if (!quarters.has(qKey)) {
			quarters.add(qKey);
			const qReturn = fundReturns.get(qKey) ?? 0;
			compounded *= 1 + qReturn / 100;
		}
		current.setMonth(current.getMonth() + 3);
	}

	return (compounded - 1) * 100;
}

// ── Personal What-If ───────────────────────────────────────

/**
 * Port of personal_what_if() from Python.
 *
 * Given the user's actual balance snapshots and each fund's quarterly returns + fees,
 * calculate what the balance would have been in each alternative fund,
 * keeping contributions identical.
 */
export function personalWhatIf(
	snapshots: BalanceSnapshot[],
	fundIds: string[],
	returns: FundReturn[],
	fees: FundFee[],
): WhatIfPoint[] {
	if (snapshots.length < 2) return [];

	const sorted = [...snapshots].sort((a, b) =>
		a.recorded_date.localeCompare(b.recorded_date),
	);
	const returnLookup = buildReturnLookup(returns);
	const feeLookup = new Map(fees.map((f) => [f.fund_id, f]));

	const results: WhatIfPoint[] = [];
	const altBalances: Record<string, number> = {};

	for (const fid of fundIds) {
		altBalances[fid] = sorted[0].balance;
	}

	results.push({
		date: sorted[0].recorded_date,
		actual: sorted[0].balance,
		...Object.fromEntries(fundIds.map((fid) => [fid, sorted[0].balance])),
	});

	for (let i = 0; i < sorted.length - 1; i++) {
		const s = sorted[i];
		const e = sorted[i + 1];
		const startDate = parseDate(s.recorded_date);
		const endDate = parseDate(e.recorded_date);
		const daysBetween =
			(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
		const yearFraction = daysBetween / 365.25;

		const contributions =
			(e.employer_contribution ?? 0) + (e.salary_sacrifice ?? 0);

		const point: WhatIfPoint = {
			date: e.recorded_date,
			actual: e.balance,
		};

		for (const fid of fundIds) {
			const prevBal = altBalances[fid];
			const retPct = resolveQuarterlyReturn(
				returnLookup.get(fid),
				startDate,
				endDate,
			);
			const grossReturn = prevBal * (retPct / 100);

			let feeCost = 0;
			const fee = feeLookup.get(fid);
			if (fee) {
				let totalPct = fee.admin_fee_pct + fee.investment_fee_pct;
				if (fee.performance_fee_pct) totalPct += fee.performance_fee_pct;
				if (fee.transaction_cost_pct) totalPct += fee.transaction_cost_pct;
				feeCost =
					(prevBal * totalPct / 100 + fee.admin_fee_flat) * yearFraction;
			}

			const newBal = prevBal + grossReturn - feeCost + contributions;
			altBalances[fid] = newBal;
			point[fid] = Math.round(newBal * 100) / 100;
		}

		results.push(point);
	}

	return results;
}

// ── SMSF BTC What-If ──────────────────────────────────────

/**
 * Port of smsf_btc_what_if() from Python.
 *
 * Simulates converting all super into an SMSF with 100% Bitcoin allocation.
 * Uses DCA: each month, contribute (employer + salary sacrifice) / months minus
 * SMSF running costs, then buy BTC at that month's close price.
 */
export function smsfBtcWhatIf(
	snapshots: BalanceSnapshot[],
	btcPrices: BtcPriceMonthly[],
	smsfAnnualCost: number,
	exchangeFeePct: number,
): SmsfBtcResult | null {
	if (snapshots.length < 2 || btcPrices.length === 0) return null;

	const sorted = [...snapshots].sort((a, b) =>
		a.recorded_date.localeCompare(b.recorded_date),
	);

	const priceMap = new Map(
		btcPrices.map((p) => [p.price_date, p.btc_aud_close]),
	);
	const pricesSorted = [...btcPrices].sort((a, b) =>
		a.price_date.localeCompare(b.price_date),
	);

	function btcPriceForDate(d: Date): number {
		// Try exact date first (e.g. 15th of month for contributions)
		const exact = dateKey(d);
		if (priceMap.has(exact)) return priceMap.get(exact)!;

		// Try the 15th of same month (contribution date)
		const mid = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-15`;
		if (priceMap.has(mid)) return priceMap.get(mid)!;

		// Fallback to 1st of month
		const first = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
		if (priceMap.has(first)) return priceMap.get(first)!;

		// Last resort: closest price on or before this date
		let bestPrice = pricesSorted[0].btc_aud_close;
		for (const p of pricesSorted) {
			if (p.price_date <= exact) bestPrice = p.btc_aud_close;
			else break;
		}
		return bestPrice;
	}

	const initialBalance = sorted[0].balance;
	const initialDate = parseDate(sorted[0].recorded_date);
	const initialPrice = btcPriceForDate(initialDate);
	const initialBtc = (initialBalance * (1 - exchangeFeePct)) / initialPrice;

	let totalBtc = initialBtc;
	let totalContributed = initialBalance;
	const monthlySMSFCost = smsfAnnualCost / 12;

	const snapshotValues: SmsfBtcResult["snapshotValues"] = [
		{ date: sorted[0].recorded_date, audValue: initialBalance },
	];

	for (let i = 0; i < sorted.length - 1; i++) {
		const sStart = sorted[i];
		const sEnd = sorted[i + 1];
		const startDate = parseDate(sStart.recorded_date);
		const endDate = parseDate(sEnd.recorded_date);

		const months = monthsBetween(startDate, endDate);
		const quarterlyContrib =
			(sEnd.employer_contribution ?? 0) + (sEnd.salary_sacrifice ?? 0);
		const monthlyGross = months > 0 ? quarterlyContrib / months : 0;

		for (let m = 1; m <= months; m++) {
			const monthDate = addMonths(startDate, m);
			// Use 15th of the month as the contribution/buy date
			const buyDate = new Date(
				monthDate.getFullYear(),
				monthDate.getMonth(),
				15,
			);
			const netContribution = monthlyGross - monthlySMSFCost;

			if (netContribution > 0) {
				const price = btcPriceForDate(buyDate);
				const btcBought =
					(netContribution * (1 - exchangeFeePct)) / price;
				totalBtc += btcBought;
				totalContributed += netContribution;
			}
		}

		const endPrice = btcPriceForDate(endDate);
		const audValue = Math.round(totalBtc * endPrice * 100) / 100;
		snapshotValues.push({ date: sEnd.recorded_date, audValue });
	}

	const latestPrice = pricesSorted.at(-1)!.btc_aud_close;
	const currentAudValue = Math.round(totalBtc * latestPrice * 100) / 100;

	return {
		snapshotValues,
		totalBtc,
		totalContributedAud: Math.round(totalContributed * 100) / 100,
		currentAudValue,
		currentBtcPrice: latestPrice,
	};
}
