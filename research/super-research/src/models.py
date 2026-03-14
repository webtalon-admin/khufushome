from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class FundConfig(BaseModel):
    id: str
    name: str
    option: str
    type: str  # "industry" | "retail"
    aum_billions: Optional[float] = None
    members: Optional[int] = None
    return_target: str
    target_horizon_years: int
    growth_defensive_split: list[int] = Field(min_length=2, max_length=2)
    website: str
    notes: str = ""


class AnnualReturn(BaseModel):
    fund_id: str
    fy: str  # e.g. "FY2025"
    return_pct: float
    return_type: str  # "after_investment_fees" | "after_all_fees_50k"
    source: str = ""

    @property
    def fy_end_year(self) -> int:
        return int(self.fy.replace("FY", ""))


class AnnualisedReturn(BaseModel):
    fund_id: str
    period: str  # "1yr", "3yr", "5yr", "7yr", "10yr", "20yr", "since_inception"
    return_pct: float
    as_at: date
    source: str = ""

    @property
    def period_years(self) -> Optional[int]:
        mapping = {"1yr": 1, "3yr": 3, "5yr": 5, "7yr": 7, "10yr": 10, "20yr": 20}
        return mapping.get(self.period)


class AssetAllocation(BaseModel):
    fund_id: str
    australian_equities: Optional[float] = None
    international_equities: Optional[float] = None
    property: Optional[float] = None
    infrastructure: Optional[float] = None
    private_equity: Optional[float] = None
    alternatives: Optional[float] = None
    fixed_income: Optional[float] = None
    cash: Optional[float] = None
    source: str = ""

    def to_dict_clean(self) -> dict[str, float]:
        """Return only non-None allocation fields as a dict."""
        fields = [
            "australian_equities",
            "international_equities",
            "property",
            "infrastructure",
            "private_equity",
            "alternatives",
            "fixed_income",
            "cash",
        ]
        return {f: getattr(self, f) for f in fields if getattr(self, f) is not None}


class FeeStructure(BaseModel):
    fund_id: str
    admin_fee_flat: float = 0.0
    admin_fee_pct: float = 0.0
    investment_fee_pct: float = 0.0
    performance_fee_pct: Optional[float] = None
    transaction_cost_pct: Optional[float] = None
    total_pct_approx: Optional[float] = None
    total_on_50k: Optional[float] = None
    total_on_100k: Optional[float] = None
    source: str = ""

    def calculate_total_fee(self, balance: float) -> float:
        """Calculate estimated total annual fee for a given balance."""
        pct = self.admin_fee_pct + self.investment_fee_pct
        if self.performance_fee_pct:
            pct += self.performance_fee_pct
        if self.transaction_cost_pct:
            pct += self.transaction_cost_pct
        return self.admin_fee_flat + (balance * pct / 100)


class ContributionSnapshot(BaseModel):
    date: date
    annual_salary: Optional[float] = None
    balance_at_date: Optional[float] = None


class PersonalProfile(BaseModel):
    name: str = "User"
    age: int
    retirement_age: int = 60
    current_fund: str
    current_balance: float = 0.0
    join_date: date
    annual_salary: float
    sg_rate: float = 0.115
    voluntary_contribution_annual: float = 0.0
    contribution_history: list[ContributionSnapshot] = []

    class Assumptions(BaseModel):
        inflation_rate: float = 0.03
        salary_growth_rate: float = 0.03
        sg_rate_future: float = 0.12

    assumptions: Assumptions = Assumptions()

    @property
    def years_to_retirement(self) -> int:
        return max(0, self.retirement_age - self.age)

    @property
    def annual_sg_contribution(self) -> float:
        return self.annual_salary * self.sg_rate

    @property
    def total_annual_contribution(self) -> float:
        return self.annual_sg_contribution + self.voluntary_contribution_annual
