# Superannuation Fund Research and Comparison Tool

> **Owner:** Personal research project
> **Started:** 2026-03-14
> **Last updated:** 2026-03-14 (ALL PHASES COMPLETE)
> **Current fund:** Future Super (Growth)
> **Next scheduled update:** 2026-09-14

---

## Profile

| Detail | Value |
|---|---|
| Age bracket | 30-40 |
| Risk profile | Growth (higher risk, maximise long-term returns) |
| Ethical preference | None -- purely returns and fees focused |
| Current fund | Future Super |
| Investment horizon | 25-30 years to preservation age |

---

## Objective

Compare Future Super against the top-performing Australian superannuation funds to determine the best growth option based on:
- Historical and forecasted returns
- Asset allocation (what each fund actually invests in)
- Fee structures and their long-term impact
- Personal "what-if" modelling using real balance and contribution data

Build an interactive tool (Streamlit app) that can be reused, updated every six months, and eventually lifted into a standalone web application.

---

## Funds Under Comparison

| # | Fund | Option | Type |
|---|---|---|---|
| 1 | **Future Super** | Growth | Industry (current fund) |
| 2 | AustralianSuper | Growth | Industry |
| 3 | Hostplus | Balanced / Shares Plus | Industry |
| 4 | UniSuper | Growth | Industry |
| 5 | Australian Retirement Trust | Growth | Industry |
| 6 | Aware Super | Growth | Industry |
| 7 | HESTA | Growth | Industry |
| 8 | Rest Super | Growth | Industry |
| 9 | Vanguard Super | Growth Index | Retail |

---

## Technology Stack

| Component | Tool | Why |
|---|---|---|
| Language | Python 3.11+ | Best for data analysis, easy web app migration |
| Web UI | Streamlit | Fastest path from script to interactive app |
| Charts | Plotly | Interactive, embeddable, works in Streamlit and future React app |
| Data | pandas | Industry standard for tabular data |
| Data models | Pydantic | Structured validation for fund and personal data |
| Config | YAML | Human-readable personal input files |
| Reports | Jinja2 + Markdown | Templated fund research papers |

### Future Migration Path

1. **Now:** Streamlit app (local, Python only)
2. **Later:** FastAPI backend (reuse all Python logic)
3. **Eventually:** React/Next.js frontend (replace Streamlit UI)
4. **Ongoing:** Automated 6-monthly research agent updates

---

## Project Structure

```
super-research/
  config/
    personal.yaml          # Your balance, contributions, salary, age
    funds.yaml             # Fund metadata, URLs, identifiers
  data/
    returns/               # Historical return data per fund (CSV)
    allocations/           # Asset allocation data per fund (CSV)
    fees/                  # Fee structures per fund (CSV)
  research/
    fund_papers/           # Detailed research paper per fund (Markdown)
    sources/               # Raw source material and references
  src/
    models.py              # Pydantic data models
    data_loader.py         # Load and validate all data
    analysis.py            # Comparison engine, projections, what-ifs
    charts.py              # All Plotly chart builders
    report_generator.py    # Jinja2-based fund paper generator
  app.py                   # Streamlit application (main entry point)
  requirements.txt
  README.md
  plan.md                  # This file
```

---

## Execution Checklist

### Phase 1: Data Collection and Research
- [x] Collect historical returns for all 9 funds (1yr, 3yr, 5yr, 7yr, 10yr) -- DONE 2026-03-14
- [x] Collect asset allocation breakdown for each fund's growth option -- DONE 2026-03-14
- [x] Collect fee structures (admin fee, investment fee, total cost) -- DONE 2026-03-14
- [x] Collect investment objectives and return targets -- DONE 2026-03-14
- [x] Collect fund size (AUM) and membership numbers -- DONE 2026-03-14
- [ ] Save all raw data into `data/` as CSVs (will be done during Phase 2 scaffold)

### Phase 2: Project Scaffold
- [x] Create project directory structure -- DONE 2026-03-14
- [x] Create `requirements.txt` with pinned dependencies -- DONE 2026-03-14
- [x] Create Pydantic data models (`src/models.py`) -- DONE 2026-03-14
- [x] Create `config/funds.yaml` with fund metadata (10 funds) -- DONE 2026-03-14
- [x] Create `config/personal.yaml` template for personal inputs -- DONE 2026-03-14
- [x] Create data loader (`src/data_loader.py`) -- DONE 2026-03-14
- [x] Create analysis engine (`src/analysis.py`) -- DONE 2026-03-14 (projections, what-if, fee drag, scenarios)
- [x] Create charts module (`src/charts.py`) -- DONE 2026-03-14 (8 chart types)
- [x] Create report generator (`src/report_generator.py`) -- DONE 2026-03-14
- [x] Create Streamlit app (`app.py`) with 6 pages -- DONE 2026-03-14
- [x] Save research data as CSVs (returns, allocations, fees) -- DONE 2026-03-14
- [x] Install dependencies and verify app runs -- DONE 2026-03-14

### Phase 3: Personal Data Integration
- [x] User provides: current balance, join date, salary, contributions -- DONE 2026-03-14
- [x] Populate `config/personal.yaml` with real data (7 snapshots Oct 2020 - Mar 2026) -- DONE 2026-03-14
- [x] Build contribution timeline reconstruction and personal what-if engine -- DONE 2026-03-14

### Phase 4: Analysis Engine
- [ ] Build historical comparison calculator (what-if analysis)
- [ ] Build forward projection engine (to age 60/65/67)
- [ ] Build fee impact calculator (compounding fee drag over decades)
- [ ] Build sensitivity analysis (best / expected / worst case)

### Phase 5: Interactive Charts
- [ ] Annual returns line chart (all funds over time)
- [ ] Annualised returns bar chart (1/3/5/7/10yr periods)
- [ ] Personal balance waterfall chart (your money in each fund)
- [ ] Asset allocation stacked bar / sunburst chart
- [ ] Fee impact over time chart
- [ ] Forward projection chart with interactive inputs
- [ ] Scenario comparison chart

### Phase 6: Streamlit Application
- [ ] Page 1: Overview Dashboard (summary table, top recommendation)
- [ ] Page 2: Historical Performance (return charts, comparisons)
- [ ] Page 3: Asset Allocation (allocation charts, drill-downs)
- [ ] Page 4: Fee Impact (fee table, interactive slider, cumulative drag)
- [ ] Page 5: Projections (interactive inputs, trajectory chart, scenarios)
- [ ] Page 6: Fund Research Papers (rendered Markdown, downloadable)

### Phase 7: Fund Research Papers
- [x] Future Super -- detailed research paper -- DONE 2026-03-14
- [x] AustralianSuper -- detailed research paper -- DONE 2026-03-14
- [x] Hostplus (Balanced) -- detailed research paper -- DONE 2026-03-14
- [x] Hostplus (Shares Plus) -- detailed research paper -- DONE 2026-03-14
- [x] UniSuper -- detailed research paper -- DONE 2026-03-14
- [x] Australian Retirement Trust -- detailed research paper -- DONE 2026-03-14
- [x] Aware Super -- detailed research paper -- DONE 2026-03-14
- [x] HESTA -- detailed research paper -- DONE 2026-03-14
- [x] Rest Super -- detailed research paper -- DONE 2026-03-14
- [x] Vanguard Super -- detailed research paper -- DONE 2026-03-14

### Phase 8: Documentation and Update Workflow
- [x] Write README.md with setup and usage instructions -- DONE 2026-03-14
- [x] Write UPDATE_GUIDE.md with 6-monthly refresh checklist -- DONE 2026-03-14
- [x] Test full app end-to-end -- DONE 2026-03-14
- [x] First update scheduled: September 2026

---

## Data I Need From You

Before I can build the personal comparison, please provide:

1. **Current super balance** with Future Super
2. **When you joined** Future Super (approximate date is fine)
3. **Annual salary** (or just the employer SG contribution amount)
4. **Voluntary contributions** (amount and frequency, if any)
5. **Contribution history** (even rough -- e.g. "started with $X in year Y, changed jobs in year Z")

---

## Important Disclaimers

- Past performance is not a reliable indicator of future performance
- Forecasted returns are fund-stated targets, not guarantees
- All data sourced from publicly available fund disclosures and comparison sites
- This is personal research, not licensed financial advice
- Consider consulting a licensed financial adviser before making any changes to your superannuation
