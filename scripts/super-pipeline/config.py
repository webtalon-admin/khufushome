"""
Super pipeline configuration.

Tracked funds: ABNs, option names, and APRA download URLs.
Fund IDs match the `super_fund_reference.id` column in Supabase.
"""

from dataclasses import dataclass, field

APRA_BASE = "https://www.apra.gov.au/sites/default/files"

APRA_URLS = {
    "historical_performance": f"{APRA_BASE}/2026-03/Historical%20performance%20%281%29.csv",
    "historical_saa": f"{APRA_BASE}/2026-03/Historical%20SAA.csv",
    "qsps_tables_4_11": f"{APRA_BASE}/2026-03/QSPS%20December%202025%20CSV%20files%20-%20Table%204-11.zip",
}

ATO_YOURSUPER_URL = "https://www.ato.gov.au/api/v1/YourSuper/APRAData"

# ─────────────────────────────────────────────────────────────
# APRA Historical Performance CSV column candidates.
#
# Actual Dec-2025 QSPS columns (verified via --inspect):
#   rse_abn, fund_name, investment_option_name, period_end_date,
#   return_measurement_comparison_percent,
#   return_investment_five_year_volatility_comparison_percent,
#   return_investment_ten_year_volatility_comparison_percent
#
# The CSV has one row per fund per quarter.  `return_measurement_comparison_percent`
# is a quarterly return (decimal, e.g. 0.026640 = 2.66%).  There are no pre-computed
# annualised 1yr/5yr/10yr return columns — annual FY returns must be compounded
# from the 4 quarterly figures.
# ─────────────────────────────────────────────────────────────
PERF_COL = {
    "abn": ["rse_abn", "RSE_ABN", "ABN", "Fund_ABN"],
    "rse_name": ["fund_name", "Fund Name", "Fund_Name", "rse_name", "RSE Name", "RSE_Name"],
    "product_name": [
        "investment_option_name", "Investment Option Name", "Investment_Option_Name",
        "mysuper_product_name", "MySuper Product Name", "Product Name",
    ],
    "quarter_end": [
        "period_end_date", "Period End Date", "Period_End_Date",
        "Reporting Quarter End Date", "Quarter End Date", "Period",
    ],
    "quarterly_return": [
        "return_measurement_comparison_percent",
        "Return Measurement Comparison Percent",
    ],
}

# ─────────────────────────────────────────────────────────────
# APRA Historical SAA CSV column candidates.
#
# Actual Dec-2025 QSPS columns (verified via --inspect):
#   rse_abn, rse_name, investment_option_name, time_key (YYYYMMDD),
#   InvestmentStrategicSectorType, InvestmentBenchmarkAllocationPercent,
#   ConsolidatedSectorType, ConsolidatedDomicileType, etc.
#
# The CSV is in LONG format — one row per fund per sector per quarter.
# We must pivot rows into our wide schema (one row per fund with separate
# columns for australian_equities, international_equities, etc.).
# ─────────────────────────────────────────────────────────────
SAA_COL = {
    "abn": ["rse_abn", "RSE_ABN", "ABN"],
    "rse_name": ["rse_name", "RSE Name", "fund_name", "Fund Name"],
    "product_name": [
        "investment_option_name", "Investment Option Name",
        "mysuper_product_name", "Product Name",
    ],
    "quarter_end": [
        "time_key", "Time_Key", "period_end_date",
        "Period End Date", "Quarter End Date",
    ],
    "sector_type": [
        "InvestmentStrategicSectorType",
        "ConsolidatedSectorType",
    ],
    "domicile": [
        "InvestmentStrategicSectorDomicileType",
        "ConsolidatedDomicileType",
    ],
    "allocation_pct": [
        "InvestmentBenchmarkAllocationPercent",
        "Investment Benchmark Allocation Percent",
    ],
}

# Mapping from APRA sector type values to our DB columns.
# The SAA CSV uses InvestmentStrategicSectorType + domicile to distinguish
# Australian vs International equities.
SAA_SECTOR_MAP = {
    "cash": "cash",
    "fixed income": "fixed_income",
    "credit": "fixed_income",
    "bonds": "fixed_income",
    "property": "property",
    "infrastructure": "infrastructure",
    "private equity": "private_equity",
    "unlisted equity": "private_equity",
}

# Equity is split by domicile:
#   "Australian Domicile" -> australian_equities
#   Everything else       -> international_equities
SAA_EQUITY_SECTORS = {"equity", "equities", "listed equity"}


@dataclass
class FundConfig:
    id: str
    name: str
    option: str
    fund_type: str
    abn: str | None
    aum_billions: float | None
    members: int | None
    return_target: str | None
    growth_defensive_split: dict | None
    website: str | None
    notes: str | None
    apra_rse_names: list[str] = field(default_factory=list)
    apra_product_patterns: list[str] = field(default_factory=list)


TRACKED_FUNDS: list[FundConfig] = [
    FundConfig(
        id="future_super",
        name="Future Super",
        option="Sustainable Growth",
        fund_type="retail",
        abn="45960194277",
        aum_billions=2.2,
        members=55_000,
        return_target="CPI + 3.0%",
        growth_defensive_split={"growth": 85, "defensive": 15},
        website="https://www.futuresuper.com.au",
        notes="Ethical screens exclude fossil fuels, banks, weapons, tobacco, gambling.",
        apra_rse_names=["Future Super", "Future Super Fund"],
        apra_product_patterns=["Sustainable Growth", "Balanced Impact", "Growth"],
    ),
    FundConfig(
        id="australian_super",
        name="AustralianSuper",
        option="Balanced",
        fund_type="industry",
        abn="65714394898",
        aum_billions=389,
        members=3_500_000,
        return_target="CPI + 3.8%",
        growth_defensive_split={"growth": 70, "defensive": 30},
        website="https://www.australiansuper.com",
        notes="Australia's largest super fund.",
        apra_rse_names=["AustralianSuper"],
        apra_product_patterns=["Balanced"],
    ),
    FundConfig(
        id="hostplus_balanced",
        name="Hostplus",
        option="Balanced",
        fund_type="industry",
        abn="68657495890",
        aum_billions=134.5,
        members=1_870_000,
        return_target="CPI + 2.5-3.0%",
        growth_defensive_split={"growth": 75, "defensive": 25},
        website="https://hostplus.com.au",
        notes="Very high alternatives allocation (~32%).",
        apra_rse_names=["Hostplus", "Hostplus Superannuation Fund"],
        apra_product_patterns=["Balanced"],
    ),
    FundConfig(
        id="hostplus_shares_plus",
        name="Hostplus",
        option="Shares Plus",
        fund_type="industry",
        abn="68657495890",
        aum_billions=7.0,
        members=None,
        return_target=None,
        growth_defensive_split={"growth": 96, "defensive": 4},
        website="https://hostplus.com.au",
        notes="Near-100% growth assets. Zero fixed income/cash.",
        apra_rse_names=["Hostplus", "Hostplus Superannuation Fund"],
        apra_product_patterns=["Shares Plus"],
    ),
    FundConfig(
        id="unisuper",
        name="UniSuper",
        option="Growth",
        fund_type="industry",
        abn="91385943850",
        aum_billions=140,
        members=680_500,
        return_target="CPI + 3.5%",
        growth_defensive_split={"growth": 80, "defensive": 20},
        website="https://www.unisuper.com.au",
        notes="Significant internal management. Originally university sector.",
        apra_rse_names=["UniSuper"],
        apra_product_patterns=["Growth"],
    ),
    FundConfig(
        id="art_high_growth",
        name="Australian Retirement Trust",
        option="High Growth",
        fund_type="industry",
        abn="60905115063",
        aum_billions=335,
        members=2_400_000,
        return_target="CPI + 4.0%",
        growth_defensive_split={"growth": 85, "defensive": 15},
        website="https://www.australianretirementtrust.com.au",
        notes="2nd largest fund. Formed 2022 from Sunsuper + QSuper merger.",
        apra_rse_names=["Australian Retirement Trust", "Sunsuper", "QSuper"],
        apra_product_patterns=["High Growth"],
    ),
    FundConfig(
        id="aware_super",
        name="Aware Super",
        option="High Growth",
        fund_type="industry",
        abn="53226460365",
        aum_billions=210,
        members=1_100_000,
        return_target="CPI + 4.0%",
        growth_defensive_split={"growth": 88, "defensive": 12},
        website="https://aware.com.au",
        notes="3rd largest fund. Whole-of-Fund model.",
        apra_rse_names=["Aware Super", "First State Super"],
        apra_product_patterns=["High Growth"],
    ),
    FundConfig(
        id="hesta_high_growth",
        name="HESTA",
        option="High Growth",
        fund_type="industry",
        abn="64971749321",
        aum_billions=100,
        members=1_085_000,
        return_target="CPI + 4.0%",
        growth_defensive_split={"growth": 82, "defensive": 18},
        website="https://www.hesta.com.au",
        notes="Health & community services focus.",
        apra_rse_names=["HESTA", "H.E.S.T. Australia"],
        apra_product_patterns=["High Growth"],
    ),
    FundConfig(
        id="rest_super",
        name="Rest Super",
        option="Growth",
        fund_type="industry",
        abn="62653671394",
        aum_billions=99,
        members=2_000_000,
        return_target="CPI + 3.0%",
        growth_defensive_split={"growth": 77, "defensive": 23},
        website="https://rest.com.au",
        notes="Originally retail sector. 37-year track record.",
        apra_rse_names=["Rest", "Retail Employees Superannuation Trust"],
        apra_product_patterns=["Growth", "Core Strategy"],
    ),
    FundConfig(
        id="vanguard_super",
        name="Vanguard Super",
        option="Growth",
        fund_type="retail",
        abn="71071957202",
        aum_billions=3.2,
        members=36_374,
        return_target="CPI + 3.25%",
        growth_defensive_split={"growth": 70, "defensive": 30},
        website="https://www.vanguard.com.au",
        notes="100% passive/indexed. Lowest fees. Launched Oct 2022.",
        apra_rse_names=["Vanguard Super", "Vanguard Super SaveSmart"],
        apra_product_patterns=["Growth"],
    ),
]

FUND_ID_MAP = {f.id: f for f in TRACKED_FUNDS}
FUND_ABN_MAP: dict[str, list[FundConfig]] = {}
for _f in TRACKED_FUNDS:
    if _f.abn:
        FUND_ABN_MAP.setdefault(_f.abn, []).append(_f)
