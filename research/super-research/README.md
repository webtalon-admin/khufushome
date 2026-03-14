# Super Fund Research & Comparison Tool

A personal superannuation comparison tool built with Python and Streamlit. Compares Future Super (current fund) against the top-performing Australian super funds with interactive charts, personal what-if modelling, and detailed fund research papers.

## Quick Start

```bash
# Create venv and install dependencies (requires uv: https://docs.astral.sh/uv/)
uv sync

# Run the app
uv run streamlit run app.py
```

Or without uv:

```bash
pip install -r requirements.txt
streamlit run app.py
```

The app will open at `http://localhost:8501`.

## Features

### Dashboard Pages

1. **Overview** -- Summary table, Australian benchmark comparison (median/average by age), key takeaway
2. **Historical Performance** -- Personal what-if chart (your actual balance vs alternatives), annualised returns, year-by-year returns
3. **Asset Allocation** -- Stacked bar charts, growth/defensive splits, detailed allocation tables
4. **Fee Impact** -- Fee comparison bars, interactive fee calculator with slider, cumulative fee drag over time
5. **Projections** -- Forward balance projections with interactive inputs, scenario analysis (optimistic/expected/conservative)
6. **Fund Research Papers** -- Detailed Markdown research paper for each fund, downloadable

### Personal What-If Analysis

Using your actual balance snapshots from `config/personal.yaml`, the tool calculates what your super would be worth today if you had been in each alternative fund -- same contributions, different returns. Your fund is shown as a bold solid line, alternatives as dotted lines.

### Funds Compared

| Fund | Option | Type |
|------|--------|------|
| Future Super | Sustainable Growth | Retail (current) |
| AustralianSuper | Balanced | Industry |
| Hostplus | Balanced | Industry |
| Hostplus | Shares Plus | Industry |
| UniSuper | Growth | Industry |
| Australian Retirement Trust | High Growth | Industry |
| Aware Super | High Growth | Industry |
| HESTA | High Growth | Industry |
| Rest Super | Growth | Industry |
| Vanguard Super | Growth | Retail |

## Project Structure

```
super-research/
├── app.py                              # Streamlit app (main entry point)
├── pyproject.toml                      # Project metadata and dependencies (uv)
├── uv.lock                             # Locked dependency versions
├── requirements.txt                    # Python dependencies (pip fallback)
├── README.md                           # This file
├── UPDATE_GUIDE.md                     # Six-monthly refresh instructions
├── config/
│   ├── funds.yaml                      # Fund metadata and configuration
│   └── personal.yaml                   # Your personal details (balance, salary, etc.)
├── data/
│   ├── returns/
│   │   ├── annual_returns.csv          # Year-by-year fund returns
│   │   └── annualised_returns.csv      # 1/3/5/7/10yr annualised returns
│   ├── allocations/
│   │   └── asset_allocations.csv       # Fund asset allocation breakdowns
│   ├── fees/
│   │   └── fee_structures.csv          # Fee structures per fund
│   └── benchmarks/
│       └── au_median_balance_by_age.csv # ATO median/average balances by age
├── research/
│   └── fund_papers/                    # Detailed research paper per fund (Markdown)
└── src/
    ├── models.py                       # Pydantic data models
    ├── data_loader.py                  # YAML/CSV data loaders
    ├── analysis.py                     # Comparison engine, projections, what-if
    ├── charts.py                       # Plotly chart builders
    └── report_generator.py             # Jinja2 fund paper generator
```

## Updating Your Personal Data

Edit `config/personal.yaml` with your details:
- `current_balance` -- your latest super balance
- `annual_salary` -- your gross salary
- `contribution_history` -- add new balance snapshots over time
- `age` -- update annually

The app reads this file on startup. After editing, refresh the Streamlit app (or restart it).

## Technology Stack

| Component | Tool |
|-----------|------|
| Language | Python 3.10+ |
| Package Manager | uv (pip fallback available) |
| Web UI | Streamlit |
| Charts | Plotly |
| Data | pandas |
| Models | Pydantic |
| Config | YAML |
| Reports | Jinja2 + Markdown |

## Future Migration Path

1. **Now:** Streamlit app (local)
2. **Next:** FastAPI backend (reuse all `src/` Python logic)
3. **Then:** React/Next.js frontend (replace Streamlit UI)
4. **Ongoing:** Automated six-monthly research agent updates

## Disclaimer

Past performance is not a reliable indicator of future performance. This is personal research, not licensed financial advice. Consider consulting a licensed financial adviser before making changes to your superannuation.
