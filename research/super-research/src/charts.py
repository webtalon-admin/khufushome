from __future__ import annotations

from typing import Optional

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from .models import FundConfig

COLOUR_PALETTE = [
    "#2E86AB",  # blue
    "#A23B72",  # magenta
    "#F18F01",  # orange
    "#C73E1D",  # red
    "#3B1F2B",  # dark plum
    "#44BBA4",  # teal
    "#E94F37",  # coral
    "#393E41",  # charcoal
    "#8ACB88",  # green
    "#5C4D7D",  # purple
    "#D4A373",  # tan
]


_VIRTUAL_FUND_LABELS = {
    "smsf_btc": "SMSF 100% Bitcoin",
}


def _fund_label(fund_id: str, funds: dict[str, FundConfig]) -> str:
    if fund_id in _VIRTUAL_FUND_LABELS:
        return _VIRTUAL_FUND_LABELS[fund_id]
    if fund_id in funds:
        f = funds[fund_id]
        return f"{f.name} ({f.option})"
    return fund_id


def annualised_returns_bar(
    df: pd.DataFrame,
    funds: dict[str, FundConfig],
    periods: list[str] | None = None,
) -> go.Figure:
    """Grouped bar chart of annualised returns across funds and periods."""
    periods = periods or ["1yr", "3yr", "5yr", "10yr"]
    filtered = df[df["period"].isin(periods)].copy()
    filtered["fund_label"] = filtered["fund_id"].map(lambda x: _fund_label(x, funds))

    period_order = {p: i for i, p in enumerate(periods)}
    filtered["period_order"] = filtered["period"].map(period_order)
    filtered = filtered.sort_values(["period_order", "return_pct"], ascending=[True, False])

    fig = px.bar(
        filtered,
        x="period",
        y="return_pct",
        color="fund_label",
        barmode="group",
        labels={"return_pct": "Return (% p.a.)", "period": "Period", "fund_label": "Fund"},
        color_discrete_sequence=COLOUR_PALETTE,
    )
    fig.update_layout(
        title="Annualised Returns by Period",
        xaxis_title="",
        yaxis_title="Return (% p.a.)",
        legend_title="Fund",
        template="plotly_white",
        height=500,
    )
    return fig


def annual_returns_line(
    df: pd.DataFrame,
    funds: dict[str, FundConfig],
    fund_ids: list[str] | None = None,
) -> go.Figure:
    """Line chart of year-by-year annual returns."""
    if fund_ids:
        df = df[df["fund_id"].isin(fund_ids)]

    fig = go.Figure()
    for i, fund_id in enumerate(df["fund_id"].unique()):
        fund_data = df[df["fund_id"] == fund_id].sort_values("fy_end_year")
        fig.add_trace(go.Scatter(
            x=fund_data["fy_end_year"],
            y=fund_data["return_pct"],
            mode="lines+markers",
            name=_fund_label(fund_id, funds),
            line=dict(color=COLOUR_PALETTE[i % len(COLOUR_PALETTE)]),
            hovertemplate="%{y:.2f}%<extra>%{fullData.name}</extra>",
        ))

    fig.add_hline(y=0, line_dash="dash", line_color="grey", opacity=0.5)
    fig.update_layout(
        title="Year-by-Year Annual Returns",
        xaxis_title="Financial Year (ending June)",
        yaxis_title="Return (%)",
        template="plotly_white",
        height=500,
        hovermode="x unified",
    )
    return fig


def fee_comparison_bar(
    df: pd.DataFrame,
    funds: dict[str, FundConfig],
    balance_col: str = "total_on_50k",
) -> go.Figure:
    """Horizontal bar chart of total fees, sorted cheapest to most expensive."""
    filtered = df.dropna(subset=[balance_col]).copy()
    filtered["fund_label"] = filtered["fund_id"].map(lambda x: _fund_label(x, funds))
    filtered = filtered.sort_values(balance_col, ascending=True)

    fig = px.bar(
        filtered,
        x=balance_col,
        y="fund_label",
        orientation="h",
        labels={balance_col: "Total Annual Fee ($)", "fund_label": ""},
        color=balance_col,
        color_continuous_scale=["#44BBA4", "#F18F01", "#C73E1D"],
    )
    fig.update_layout(
        title=f"Total Annual Fees (on ${balance_col.split('_')[-1]} balance)",
        template="plotly_white",
        height=450,
        showlegend=False,
        coloraxis_showscale=False,
    )
    return fig


def asset_allocation_stacked_bar(
    df: pd.DataFrame,
    funds: dict[str, FundConfig],
) -> go.Figure:
    """Stacked horizontal bar chart showing asset allocation per fund."""
    asset_cols = [
        "australian_equities",
        "international_equities",
        "property",
        "infrastructure",
        "private_equity",
        "alternatives",
        "fixed_income",
        "cash",
    ]
    asset_labels = {
        "australian_equities": "AU Equities",
        "international_equities": "Intl Equities",
        "property": "Property",
        "infrastructure": "Infrastructure",
        "private_equity": "Private Equity",
        "alternatives": "Alternatives",
        "fixed_income": "Fixed Income",
        "cash": "Cash",
    }
    asset_colours = {
        "australian_equities": "#2E86AB",
        "international_equities": "#A23B72",
        "property": "#F18F01",
        "infrastructure": "#44BBA4",
        "private_equity": "#C73E1D",
        "alternatives": "#5C4D7D",
        "fixed_income": "#8ACB88",
        "cash": "#D4A373",
    }

    plot_df = df.copy()
    plot_df["fund_label"] = plot_df["fund_id"].map(lambda x: _fund_label(x, funds))

    fig = go.Figure()
    for col in asset_cols:
        if col in plot_df.columns:
            fig.add_trace(go.Bar(
                y=plot_df["fund_label"],
                x=plot_df[col].fillna(0),
                name=asset_labels.get(col, col),
                orientation="h",
                marker_color=asset_colours.get(col, "#999"),
                hovertemplate="%{x:.1f}%<extra>" + asset_labels.get(col, col) + "</extra>",
            ))

    fig.update_layout(
        barmode="stack",
        title="Asset Allocation by Fund",
        xaxis_title="Allocation (%)",
        yaxis_title="",
        template="plotly_white",
        height=500,
        legend_title="Asset Class",
    )
    return fig


def projection_line(
    projections: dict[str, pd.DataFrame],
    funds: dict[str, FundConfig],
    title: str = "Projected Balance to Retirement",
) -> go.Figure:
    """Line chart comparing projected balances across funds."""
    fig = go.Figure()
    for i, (fund_id, df) in enumerate(projections.items()):
        fig.add_trace(go.Scatter(
            x=df["year"],
            y=df["balance"],
            mode="lines",
            name=_fund_label(fund_id, funds),
            line=dict(color=COLOUR_PALETTE[i % len(COLOUR_PALETTE)], width=2),
            hovertemplate="Year %{x}: $%{y:,.0f}<extra>%{fullData.name}</extra>",
        ))

    fig.update_layout(
        title=title,
        xaxis_title="Years from Now",
        yaxis_title="Balance ($)",
        template="plotly_white",
        height=500,
        hovermode="x unified",
        yaxis_tickprefix="$",
        yaxis_tickformat=",",
    )
    return fig


def fee_drag_line(
    df: pd.DataFrame,
    funds: dict[str, FundConfig],
) -> go.Figure:
    """Line chart showing cumulative fee drag over time per fund."""
    fig = go.Figure()
    fund_cols = [c for c in df.columns if c != "year"]
    for i, fund_id in enumerate(fund_cols):
        fig.add_trace(go.Scatter(
            x=df["year"],
            y=df[fund_id],
            mode="lines",
            name=_fund_label(fund_id, funds),
            line=dict(color=COLOUR_PALETTE[i % len(COLOUR_PALETTE)], width=2),
            hovertemplate="Year %{x}: $%{y:,.0f}<extra>%{fullData.name}</extra>",
        ))

    fig.update_layout(
        title="Cumulative Fees Paid Over Time",
        xaxis_title="Years",
        yaxis_title="Cumulative Fees ($)",
        template="plotly_white",
        height=500,
        hovermode="x unified",
        yaxis_tickprefix="$",
        yaxis_tickformat=",",
    )
    return fig


def scenario_fan(
    scenarios: dict[str, pd.DataFrame],
    fund_label: str,
) -> go.Figure:
    """Fan chart showing optimistic / expected / conservative projections."""
    colours = {"optimistic": "#44BBA4", "expected": "#2E86AB", "conservative": "#C73E1D"}
    dashes = {"optimistic": "dot", "expected": "solid", "conservative": "dash"}

    fig = go.Figure()
    for name, df in scenarios.items():
        fig.add_trace(go.Scatter(
            x=df["year"],
            y=df["balance"],
            mode="lines",
            name=f"{name.title()} ({df['balance'].iloc[-1]:,.0f})",
            line=dict(color=colours.get(name, "#999"), dash=dashes.get(name, "solid"), width=2),
            hovertemplate="Year %{x}: $%{y:,.0f}<extra>" + name.title() + "</extra>",
        ))

    fig.update_layout(
        title=f"Projection Scenarios — {fund_label}",
        xaxis_title="Years from Now",
        yaxis_title="Balance ($)",
        template="plotly_white",
        height=450,
        hovermode="x unified",
        yaxis_tickprefix="$",
        yaxis_tickformat=",",
    )
    return fig


def historical_what_if_line(
    df: pd.DataFrame,
    funds: dict[str, FundConfig],
    title: str = "What If: Your Balance in Each Fund",
) -> go.Figure:
    """Line chart showing hypothetical balance over time in each fund."""
    fig = go.Figure()
    fund_cols = [c for c in df.columns if c != "fy_end_year"]
    for i, fund_id in enumerate(fund_cols):
        fig.add_trace(go.Scatter(
            x=df["fy_end_year"],
            y=df[fund_id],
            mode="lines+markers",
            name=_fund_label(fund_id, funds),
            line=dict(color=COLOUR_PALETTE[i % len(COLOUR_PALETTE)], width=2),
            hovertemplate="FY%{x}: $%{y:,.0f}<extra>%{fullData.name}</extra>",
        ))

    fig.update_layout(
        title=title,
        xaxis_title="Financial Year (ending June)",
        yaxis_title="Balance ($)",
        template="plotly_white",
        height=500,
        hovermode="x unified",
        yaxis_tickprefix="$",
        yaxis_tickformat=",",
    )
    return fig


def personal_what_if_chart(
    df: pd.DataFrame,
    funds: dict[str, FundConfig],
    current_fund_id: str = "future_super",
    title: str = "Your Super: Actual vs What-If in Other Funds",
) -> go.Figure:
    """Your actual balance as a bold solid line, every alternative fund as a dotted line.

    df must have columns: [date, actual] + one column per alternative fund_id.
    """
    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=df["date"],
        y=df["actual"],
        mode="lines+markers",
        name=f"{_fund_label(current_fund_id, funds)} (YOU)",
        line=dict(color="#E94F37", width=4),
        marker=dict(size=8, symbol="circle"),
        hovertemplate="%{x|%b %Y}: $%{y:,.0f}<extra>Your actual balance</extra>",
    ))

    _VIRTUAL_COLOURS = {"smsf_btc": "#F7931A"}

    alt_cols = [c for c in df.columns if c not in ("date", "actual")]
    palette_idx = 0
    for fund_id in alt_cols:
        colour = _VIRTUAL_COLOURS.get(fund_id)
        if not colour:
            colour = COLOUR_PALETTE[palette_idx % len(COLOUR_PALETTE)]
            palette_idx += 1
        fig.add_trace(go.Scatter(
            x=df["date"],
            y=df[fund_id],
            mode="lines+markers",
            name=_fund_label(fund_id, funds),
            line=dict(color=colour, width=2, dash="dot"),
            marker=dict(size=5, symbol="diamond"),
            hovertemplate="%{x|%b %Y}: $%{y:,.0f}<extra>%{fullData.name}</extra>",
        ))

    final_actual = df["actual"].iloc[-1]
    alt_cols_with_values = [c for c in alt_cols if pd.notna(df[c].iloc[-1])]
    best_alt_col = max(alt_cols_with_values, key=lambda c: df[c].iloc[-1]) if alt_cols_with_values else alt_cols[0]
    best_alt_val = df[best_alt_col].iloc[-1]
    diff = best_alt_val - final_actual

    fig.update_layout(
        title=dict(
            text=(
                f"{title}<br>"
                f"<span style='font-size:14px; color:grey'>"
                f"You could have ${diff:,.0f} more with {_fund_label(best_alt_col, funds)}"
                f"</span>"
            ),
        ),
        xaxis_title="",
        yaxis_title="Balance ($)",
        template="plotly_white",
        height=550,
        hovermode="x unified",
        yaxis_tickprefix="$",
        yaxis_tickformat=",",
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.3,
            xanchor="center",
            x=0.5,
        ),
    )
    return fig
