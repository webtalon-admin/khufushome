from __future__ import annotations

from pathlib import Path
from typing import Optional

import pandas as pd
import yaml

from .models import (
    AnnualReturn,
    AnnualisedReturn,
    AssetAllocation,
    ContributionSnapshot,
    FeeStructure,
    FundConfig,
    PersonalProfile,
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = PROJECT_ROOT / "config"
DATA_DIR = PROJECT_ROOT / "data"


def load_funds(path: Optional[Path] = None) -> list[FundConfig]:
    path = path or CONFIG_DIR / "funds.yaml"
    with open(path) as f:
        data = yaml.safe_load(f)
    return [FundConfig(**fund) for fund in data["funds"]]


def load_funds_dict(path: Optional[Path] = None) -> dict[str, FundConfig]:
    return {f.id: f for f in load_funds(path)}


def load_personal(path: Optional[Path] = None) -> PersonalProfile:
    path = path or CONFIG_DIR / "personal.yaml"
    with open(path) as f:
        data = yaml.safe_load(f)

    p = data["personal"]
    history = []
    if p.get("contribution_history"):
        for entry in p["contribution_history"]:
            history.append(ContributionSnapshot(**entry))

    return PersonalProfile(
        name=p.get("name", "User"),
        age=p["age"],
        retirement_age=p.get("retirement_age", 60),
        current_fund=p["current_fund"],
        current_balance=p.get("current_balance", 0),
        join_date=p["join_date"],
        annual_salary=p.get("annual_salary", 0),
        sg_rate=p.get("sg_rate", 0.115),
        voluntary_contribution_annual=p.get("voluntary_contribution_annual", 0),
        contribution_history=history,
        assumptions=PersonalProfile.Assumptions(**p.get("assumptions", {})),
    )


def load_annual_returns(path: Optional[Path] = None) -> pd.DataFrame:
    path = path or DATA_DIR / "returns" / "annual_returns.csv"
    df = pd.read_csv(path)
    df["fy_end_year"] = df["fy"].str.replace("FY", "").astype(int)
    return df


def load_annualised_returns(path: Optional[Path] = None) -> pd.DataFrame:
    path = path or DATA_DIR / "returns" / "annualised_returns.csv"
    df = pd.read_csv(path)
    df["as_at"] = pd.to_datetime(df["as_at"])
    return df


def load_asset_allocations(path: Optional[Path] = None) -> pd.DataFrame:
    path = path or DATA_DIR / "allocations" / "asset_allocations.csv"
    return pd.read_csv(path)


def load_fee_structures(path: Optional[Path] = None) -> pd.DataFrame:
    path = path or DATA_DIR / "fees" / "fee_structures.csv"
    return pd.read_csv(path)


def load_fee_models(path: Optional[Path] = None) -> dict[str, FeeStructure]:
    df = load_fee_structures(path)
    result = {}
    for _, row in df.iterrows():
        def safe_float(val, default=0.0):
            if pd.isna(val):
                return default
            return float(val)

        result[row["fund_id"]] = FeeStructure(
            fund_id=row["fund_id"],
            admin_fee_flat=safe_float(row.get("admin_fee_flat")),
            admin_fee_pct=safe_float(row.get("admin_fee_pct")),
            investment_fee_pct=safe_float(row.get("investment_fee_pct")),
            performance_fee_pct=safe_float(row.get("performance_fee_pct")) or None,
            transaction_cost_pct=safe_float(row.get("transaction_cost_pct")) or None,
            total_pct_approx=safe_float(row.get("total_pct_approx")) or None,
            total_on_50k=safe_float(row.get("total_on_50k")) or None,
            total_on_100k=safe_float(row.get("total_on_100k")) or None,
            source=row.get("source", ""),
        )
    return result


def load_au_benchmarks(path: Optional[Path] = None) -> pd.DataFrame:
    path = path or DATA_DIR / "benchmarks" / "au_median_balance_by_age.csv"
    return pd.read_csv(path)


def load_btc_aud_monthly(path: Optional[Path] = None) -> pd.DataFrame:
    """Load monthly BTC/AUD close prices (month-end close, labelled as 1st of month)."""
    path = path or DATA_DIR / "benchmarks" / "btc_aud_monthly.csv"
    df = pd.read_csv(path, parse_dates=["date"])
    return df


def get_benchmark_for_age(age: int, benchmarks: pd.DataFrame | None = None) -> dict:
    """Return the median/average benchmark row for a given age."""
    if benchmarks is None:
        benchmarks = load_au_benchmarks()
    row = benchmarks[(benchmarks["age_min"] <= age) & (benchmarks["age_max"] >= age)]
    if row.empty:
        return {}
    r = row.iloc[0]
    return {
        "age_group": r["age_group"],
        "male_median": r["male_median"],
        "female_median": r["female_median"],
        "male_average": r.get("male_average"),
        "female_average": r.get("female_average"),
        "male_p75": r.get("male_p75"),
        "female_p75": r.get("female_p75"),
        "male_p90": r.get("male_p90"),
        "female_p90": r.get("female_p90"),
        "source": r["source"],
    }


def get_fund_label(fund_id: str, funds: dict[str, FundConfig]) -> str:
    if fund_id in funds:
        f = funds[fund_id]
        return f"{f.name} ({f.option})"
    return fund_id
