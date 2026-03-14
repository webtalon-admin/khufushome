from __future__ import annotations

from datetime import date, timedelta

import numpy as np
import pandas as pd

from .models import ContributionSnapshot, FeeStructure, PersonalProfile


def project_balance(
    starting_balance: float,
    annual_contribution: float,
    annual_return_pct: float,
    annual_fee_pct: float,
    annual_fee_flat: float,
    years: int,
    salary_growth_rate: float = 0.03,
    sg_rate: float = 0.115,
    voluntary_annual: float = 0.0,
    use_salary_growth: bool = True,
) -> pd.DataFrame:
    """Project super balance forward year by year.

    Returns a DataFrame with columns: year, balance, contribution, return, fee, net_return.
    """
    rows = []
    balance = starting_balance
    contribution = annual_contribution

    for year in range(1, years + 1):
        investment_return = balance * (annual_return_pct / 100)
        fee = (balance * annual_fee_pct / 100) + annual_fee_flat
        net_return = investment_return - fee
        balance = balance + net_return + contribution

        rows.append({
            "year": year,
            "balance": round(balance, 2),
            "contribution": round(contribution, 2),
            "gross_return": round(investment_return, 2),
            "fee": round(fee, 2),
            "net_return": round(net_return, 2),
        })

        if use_salary_growth:
            base_salary = contribution / sg_rate if sg_rate > 0 else 0
            base_salary *= (1 + salary_growth_rate)
            contribution = base_salary * sg_rate + voluntary_annual

    return pd.DataFrame(rows)


def project_balance_for_fund(
    profile: PersonalProfile,
    fee: FeeStructure,
    annual_return_pct: float,
    years: int | None = None,
) -> pd.DataFrame:
    """Project balance using personal profile and a specific fund's fees."""
    years = years or profile.years_to_retirement
    total_fee_pct = fee.admin_fee_pct + fee.investment_fee_pct
    if fee.performance_fee_pct:
        total_fee_pct += fee.performance_fee_pct
    if fee.transaction_cost_pct:
        total_fee_pct += fee.transaction_cost_pct

    return project_balance(
        starting_balance=profile.current_balance,
        annual_contribution=profile.total_annual_contribution,
        annual_return_pct=annual_return_pct,
        annual_fee_pct=total_fee_pct,
        annual_fee_flat=fee.admin_fee_flat,
        years=years,
        salary_growth_rate=profile.assumptions.salary_growth_rate,
        sg_rate=profile.sg_rate,
        voluntary_annual=profile.voluntary_contribution_annual,
    )


def personal_what_if(
    profile: PersonalProfile,
    annual_returns: pd.DataFrame,
    fund_ids: list[str],
    fees: dict[str, FeeStructure] | None = None,
) -> pd.DataFrame:
    """Calculate what your balance would have been in each fund, using your actual
    contribution history snapshots.

    The approach:
    1. Use contribution_history as ground truth for your actual Future Super balance.
    2. Between each pair of snapshots, derive the contribution that went in
       (salary * SG rate * period_fraction).
    3. For alternative funds, start with the same initial balance and add the same
       contributions, but apply that fund's annual returns instead.

    Returns a DataFrame with columns: [date, actual] + one column per alt fund_id.
    """
    snapshots = sorted(profile.contribution_history, key=lambda s: s.date)
    if len(snapshots) < 2:
        return pd.DataFrame()

    dates = [s.date for s in snapshots]
    actual_balances = [s.balance_at_date for s in snapshots]

    contributions_between = []
    for i in range(len(snapshots) - 1):
        s = snapshots[i]
        e = snapshots[i + 1]
        days = (e.date - s.date).days
        yearly_fraction = days / 365.25
        salary = s.annual_salary or profile.annual_salary
        sg_rate = profile.sg_rate
        contrib = salary * sg_rate * yearly_fraction
        contributions_between.append(contrib)

    implied_returns_pct = []
    for i in range(len(snapshots) - 1):
        start_bal = actual_balances[i]
        end_bal = actual_balances[i + 1]
        contrib = contributions_between[i]
        if start_bal > 0:
            ret_pct = ((end_bal - start_bal - contrib) / start_bal) * 100
        else:
            ret_pct = 0.0
        implied_returns_pct.append(ret_pct)

    _resolve_annual_return = _build_return_resolver(annual_returns, snapshots)

    alt_balances: dict[str, list[float]] = {}
    for fund_id in fund_ids:
        bal = actual_balances[0]
        trail = [bal]
        for i in range(len(snapshots) - 1):
            contrib = contributions_between[i]
            alt_ret_pct = _resolve_annual_return(fund_id, snapshots[i].date, snapshots[i + 1].date)
            gross_return = bal * (alt_ret_pct / 100)

            fee_cost = 0.0
            if fees and fund_id in fees:
                f = fees[fund_id]
                days = (snapshots[i + 1].date - snapshots[i].date).days
                yearly_fraction = days / 365.25
                total_pct = f.admin_fee_pct + f.investment_fee_pct
                if f.performance_fee_pct:
                    total_pct += f.performance_fee_pct
                if f.transaction_cost_pct:
                    total_pct += f.transaction_cost_pct
                fee_cost = (bal * total_pct / 100 + f.admin_fee_flat) * yearly_fraction

            bal = bal + gross_return - fee_cost + contrib
            trail.append(round(bal, 2))
        alt_balances[fund_id] = trail

    result = pd.DataFrame({"date": dates, "actual": actual_balances})
    for fund_id, bals in alt_balances.items():
        result[fund_id] = bals

    return result


def _build_return_resolver(
    annual_returns: pd.DataFrame,
    snapshots: list[ContributionSnapshot],
) -> callable:
    """Build a function that resolves the best-available return for a fund
    over a period between two snapshot dates.

    Falls back to annualised return data or median growth fund returns when
    fund-specific year-by-year data is missing.
    """
    chant_west_medians = {
        2016: 3.0, 2017: 10.8, 2018: 9.4, 2019: 7.0, 2020: -0.6,
        2021: 18.0, 2022: -3.3, 2023: 9.2, 2024: 9.1, 2025: 10.5,
    }

    fund_fy_returns: dict[str, dict[int, float]] = {}
    for _, row in annual_returns.iterrows():
        fid = row["fund_id"]
        fy = row["fy_end_year"]
        ret = row["return_pct"]
        fund_fy_returns.setdefault(fid, {})[fy] = ret

    def resolve(fund_id: str, start_date: date, end_date: date) -> float:
        days = (end_date - start_date).days
        yearly_fraction = days / 365.25

        mid_date = start_date.replace(
            year=start_date.year + (1 if start_date.month > 6 else 0)
        )
        fy_year = mid_date.year if mid_date.month <= 6 else mid_date.year + 1

        if fund_id in fund_fy_returns and fy_year in fund_fy_returns[fund_id]:
            return fund_fy_returns[fund_id][fy_year] * yearly_fraction

        for offset in [-1, 1, -2, 2]:
            nearby = fy_year + offset
            if fund_id in fund_fy_returns and nearby in fund_fy_returns[fund_id]:
                return fund_fy_returns[fund_id][nearby] * yearly_fraction

        return chant_west_medians.get(fy_year, 8.0) * yearly_fraction

    return resolve


def historical_what_if(
    annual_returns: pd.DataFrame,
    fund_ids: list[str],
    starting_balance: float,
    annual_contribution: float,
    start_fy: int,
    end_fy: int,
    fees: dict[str, FeeStructure] | None = None,
) -> pd.DataFrame:
    """Calculate what your balance would have been in each fund using actual historical returns."""
    years = list(range(start_fy, end_fy + 1))
    result = {"fy_end_year": years}

    for fund_id in fund_ids:
        fund_data = annual_returns[annual_returns["fund_id"] == fund_id]
        fund_returns = dict(zip(fund_data["fy_end_year"], fund_data["return_pct"]))

        balance = starting_balance
        balances = []
        for fy in years:
            ret = fund_returns.get(fy)
            if ret is not None:
                gross_return = balance * (ret / 100)
            else:
                gross_return = balance * 0.08

            fee_cost = 0
            if fees and fund_id in fees:
                f = fees[fund_id]
                total_pct = f.admin_fee_pct + f.investment_fee_pct
                if f.performance_fee_pct:
                    total_pct += f.performance_fee_pct
                if f.transaction_cost_pct:
                    total_pct += f.transaction_cost_pct
                fee_cost = (balance * total_pct / 100) + f.admin_fee_flat

            balance = balance + gross_return - fee_cost + annual_contribution
            balances.append(round(balance, 2))

        result[fund_id] = balances

    return pd.DataFrame(result)


def fee_drag_over_time(
    balance: float,
    annual_return_pct: float,
    fee_structures: dict[str, FeeStructure],
    years: int = 30,
) -> pd.DataFrame:
    """Calculate cumulative fee drag for each fund over time.

    Returns DataFrame with columns [year] + one column per fund_id showing cumulative fees paid.
    """
    result = {"year": list(range(1, years + 1))}

    for fund_id, fee in fee_structures.items():
        total_pct = fee.admin_fee_pct + fee.investment_fee_pct
        if fee.performance_fee_pct:
            total_pct += fee.performance_fee_pct
        if fee.transaction_cost_pct:
            total_pct += fee.transaction_cost_pct

        bal = balance
        cum_fees = []
        total_fees = 0

        for _ in range(years):
            annual_fee = (bal * total_pct / 100) + fee.admin_fee_flat
            total_fees += annual_fee
            cum_fees.append(round(total_fees, 2))
            bal = bal * (1 + annual_return_pct / 100) - annual_fee

        result[fund_id] = cum_fees

    return pd.DataFrame(result)


def scenario_projections(
    profile: PersonalProfile,
    fee: FeeStructure,
    years: int | None = None,
) -> dict[str, pd.DataFrame]:
    """Generate optimistic / expected / conservative projection scenarios."""
    years = years or profile.years_to_retirement
    scenarios = {
        "optimistic": 10.0,
        "expected": 8.0,
        "conservative": 5.5,
    }
    return {
        name: project_balance_for_fund(profile, fee, return_pct, years)
        for name, return_pct in scenarios.items()
    }


SMSF_ANNUAL_COST = 3318  # audit $1k + accounting $2k + ASIC $59 + ATO levy $259
EXCHANGE_FEE_PCT = 0.005  # 0.5% per BTC purchase


def smsf_btc_what_if(
    profile: PersonalProfile,
    btc_prices: pd.DataFrame,
    smsf_annual_cost: float = SMSF_ANNUAL_COST,
    exchange_fee_pct: float = EXCHANGE_FEE_PCT,
) -> dict:
    """Model what the user's super would be worth if they ran a BTC-only SMSF.

    Approach:
    1. Start from first contribution snapshot — convert full balance to BTC.
    2. Each month, contribute (salary * sg_rate / 12) minus SMSF running costs.
    3. Buy BTC at that month's close price, less exchange fee.
    4. Track cumulative BTC, AUD value at each snapshot date, and total contributed.

    Returns dict with keys:
        snapshot_values: list of (date, aud_value) aligned to contribution_history dates
        total_btc: float
        total_contributed_aud: float
        current_aud_value: float
        current_btc_price: float
    """
    snapshots = sorted(profile.contribution_history, key=lambda s: s.date)
    if len(snapshots) < 2:
        return {}

    prices = btc_prices.copy()
    prices["date"] = pd.to_datetime(prices["date"])
    prices = prices.sort_values("date")

    def _btc_price_for_date(d: date) -> float:
        target = pd.Timestamp(d)
        idx = prices["date"].searchsorted(target, side="right") - 1
        idx = max(0, min(idx, len(prices) - 1))
        return float(prices.iloc[idx]["btc_aud_close"])

    initial_balance = snapshots[0].balance_at_date or 0
    initial_price = _btc_price_for_date(snapshots[0].date)
    initial_btc = (initial_balance * (1 - exchange_fee_pct)) / initial_price

    total_btc = initial_btc
    total_contributed = initial_balance
    monthly_smsf_cost = smsf_annual_cost / 12

    snapshot_values = [(snapshots[0].date, initial_balance)]

    for i in range(len(snapshots) - 1):
        s_start = snapshots[i]
        s_end = snapshots[i + 1]
        salary = s_start.annual_salary or profile.annual_salary
        monthly_gross = salary * profile.sg_rate / 12

        current = date(s_start.date.year, s_start.date.month, 1)
        end = date(s_end.date.year, s_end.date.month, 1)

        current_month = current
        while True:
            if current_month.month == 12:
                next_month = date(current_month.year + 1, 1, 1)
            else:
                next_month = date(current_month.year, current_month.month + 1, 1)

            if next_month > end:
                break

            current_month = next_month
            net_contribution = monthly_gross - monthly_smsf_cost
            if net_contribution > 0:
                btc_price = _btc_price_for_date(current_month)
                btc_bought = (net_contribution * (1 - exchange_fee_pct)) / btc_price
                total_btc += btc_bought
                total_contributed += net_contribution

        end_price = _btc_price_for_date(s_end.date)
        aud_value = total_btc * end_price
        snapshot_values.append((s_end.date, round(aud_value, 2)))

    latest_price = float(prices.iloc[-1]["btc_aud_close"])
    current_value = total_btc * latest_price

    return {
        "snapshot_values": snapshot_values,
        "total_btc": total_btc,
        "total_contributed_aud": total_contributed,
        "current_aud_value": round(current_value, 2),
        "current_btc_price": latest_price,
    }
