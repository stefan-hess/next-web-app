import matplotlib
matplotlib.use('Agg')
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import io
import matplotlib.ticker as mticker
import logging
import numpy as np

d = (10, 10)


def _make_df(period_list, value_cols):
    if not period_list:
        return pd.DataFrame(columns=['fiscalDateEnding'] + value_cols)
    df = pd.DataFrame(period_list)
    df['fiscalDateEnding'] = pd.to_datetime(df['fiscalDateEnding'])
    for c in value_cols:
        df[c] = pd.to_numeric(df[c], errors='coerce')
    df = df.sort_values('fiscalDateEnding')
    return df.set_index('fiscalDateEnding')

def auto_scale(values, currency):
    """Return (scale_factor, label) for a list of numbers."""
    if not values:
        return 1, currency
    m = max(abs(v) for v in values)
    if m >= 1e10: return 1e9, f"Billions {currency}"
    if m >= 1e7:  return 1e6, f"Millions {currency}"
    if m >= 1e4:  return 1e3, f"Thousands {currency}"
    return 1, currency

def plot_group(ax, xvals, series, label_tpl, ylabel, title, reported_currency):
        """
        ax        : matplotlib Axes
        xvals     : list of x values (annual or quarterly)
        series    : [(data, marker, color, name)]
        label_tpl : e.g. "{name} ({freq}, {scale})"
        """
        all_vals = [v for s,_,_,_ in series for v in s]
        scale, lbl = auto_scale(all_vals, reported_currency)
        for s, m, c, name in series:
            ax.plot(xvals, [v/scale for v in s], marker=m, color=c, label=name)
        ax.set_ylabel(f"Value ({lbl})")
        ax.set_title(title)
        ax.legend(loc="best")

def plot_fundamentals(ticker, fundamentals):
    # --- Helper: safe numeric parsing ---
    def _safe_num(v):
        try:
            if v is None:
                return np.nan
            if isinstance(v, str):
                s = v.strip()
                if s.lower() in ("none", "nan", "n/a", ""):
                    return np.nan
                s = s.replace(",", "")
                return float(s)
            return float(v)
        except Exception:
            return np.nan
    import logging
    logging.info(f"[PLOT DEBUG] {ticker} fundamentals keys: {list(fundamentals.keys())}")
    logging.info(f"[PLOT DEBUG] {ticker} annual entries: {len(fundamentals.get('annual', []))}")
    logging.info(f"[PLOT DEBUG] {ticker} quarterly entries: {len(fundamentals.get('quarterly', []))}")
    # Show sample annual and quarterly data
    if fundamentals.get('annual'):
        logging.info(f"[PLOT DEBUG] {ticker} sample annual: {fundamentals['annual'][0]}")
    if fundamentals.get('quarterly'):
        logging.info(f"[PLOT DEBUG] {ticker} sample quarterly: {fundamentals['quarterly'][0]}")
    
    quarterly = fundamentals.get('quarterly', [])    
    annual = fundamentals.get('annual', [])
    # Always define x and qx as empty lists
    x, y_assets, y_liabilities, y_equity = [], [], [], []
    y_revenue, y_netincome, y_costofrevenue, y_ebitda = [], [], [], []
    y_operatingcashflow, y_investmentcashflow, y_financingcashflow = [], [], []
    qx, q_assets, q_liabilities, q_equity = [], [], [], []
    q_revenue, q_netincome, q_costofrevenue, q_ebitda = [], [], [], []
    q_operatingcashflow, q_investmentcashflow, q_financingcashflow = [], [], []
    fig, axes = plt.subplots(
        nrows=4, ncols=2,
        figsize=(16, 18),
        sharex='col',
        gridspec_kw={'width_ratios': [1, 1], 'height_ratios': [1, 1, 1, 1]}
    )
    (ax1_q, ax1_a), (ax2_q, ax2_a), (ax3_q, ax3_a), (ax4_q, ax4_a) = axes
    # --- Parse shares outstanding data from annual and quarterly entries ---
    # Quarterly shares outstanding
    q_shares_dates, q_shares_basic, q_shares_diluted = [], [], []
    for entry in fundamentals.get('quarterly', []):
        date_str = entry.get('fiscalDateEnding')
        if not date_str:
            continue
        basic = np.nan
        diluted = np.nan
        try:
            date_val = pd.to_datetime(date_str)
        except Exception:
            continue
        basic = _safe_num(entry.get('shares_outstanding_basic', 0))
        diluted = _safe_num(entry.get('shares_outstanding_diluted', 0))
        q_shares_dates.append(date_val)
        q_shares_basic.append(basic)
        q_shares_diluted.append(diluted)

    # Annual shares outstanding (include all entries)
    a_shares_dates, a_shares_basic, a_shares_diluted = [], [], []
    for entry in fundamentals.get('annual', []):
        date_str = entry.get('fiscalDateEnding')
        if not date_str:
            continue
        basic = np.nan
        diluted = np.nan
        try:
            date_val = pd.to_datetime(date_str)
        except Exception:
            continue
        basic = _safe_num(entry.get('shares_outstanding_basic', 0))
        diluted = _safe_num(entry.get('shares_outstanding_diluted', 0))
        a_shares_dates.append(date_val)
        a_shares_basic.append(basic)
        a_shares_diluted.append(diluted)
    # --- Parse top-level independent shares_outstanding series (preferred) ---
    shares_entries = fundamentals.get('shares_outstanding', [])
    shares_dates, shares_basic, shares_diluted = [], [], []
    for entry in shares_entries:
        date_str = entry.get('date') or entry.get('fiscalDateEnding')
        if not date_str:
            continue
        try:
            date_val = pd.to_datetime(date_str)
        except Exception:
            continue
        basic = float(entry.get('shares_outstanding_basic', entry.get('basic', 0) or 0))
        diluted = float(entry.get('shares_outstanding_diluted', entry.get('diluted', 0) or 0))
        shares_dates.append(date_val)
        shares_basic.append(basic)
        shares_diluted.append(diluted)
    # Default currency
    reported_currency = None
    if annual and 'reportedCurrency' in annual[0]:
        reported_currency = annual[0]['reportedCurrency']
    else:
        reported_currency = "USD"

    # --- Parse annual data ---
    x, y_assets, y_liabilities, y_equity = [], [], [], []
    y_revenue, y_netincome, y_costofrevenue, y_ebitda = [], [], [], []
    y_operatingcashflow, y_investmentcashflow, y_financingcashflow = [], [], []
    if annual:
        annual_sorted = sorted(annual, key=lambda x: x.get('fiscalDateEnding', ''))
        for row in annual_sorted:
            try:
                date_val = pd.to_datetime(row['fiscalDateEnding'])
                x.append(date_val)
                y_assets.append(_safe_num(row.get('totalAssets', 0)))
                y_liabilities.append(_safe_num(row.get('totalLiabilities', 0)))
                y_equity.append(_safe_num(row.get('totalShareholderEquity', 0)))
                y_revenue.append(_safe_num(row.get('totalRevenue', 0)))
                y_netincome.append(_safe_num(row.get('netIncome', 0)))
                y_costofrevenue.append(_safe_num(row.get('costOfRevenue', 0)))
                y_ebitda.append(_safe_num(row.get('ebitda', 0)))
                y_operatingcashflow.append(_safe_num(row.get('operatingCashflow', 0)))
                y_investmentcashflow.append(_safe_num(row.get('cashflowFromInvestment', 0)))
                y_financingcashflow.append(_safe_num(row.get('cashflowFromFinancing', 0)))
            except Exception as e:
                logging.error(f"Error converting annual row {row}: {e}")
                continue

    # --- Parse quarterly data ---
    qx, q_assets, q_liabilities, q_equity = [], [], [], []
    q_revenue, q_netincome, q_costofrevenue, q_ebitda = [], [], [], []
    q_operatingcashflow, q_investmentcashflow, q_financingcashflow = [], [], []
    if quarterly:
        quarterly_sorted = sorted(quarterly, key=lambda x: x.get('fiscalDateEnding', ''))
        for row in quarterly_sorted:
            try:
                date_val = pd.to_datetime(row['fiscalDateEnding'])
                qx.append(date_val)
                q_assets.append(_safe_num(row.get('totalAssets', 0)))
                q_liabilities.append(_safe_num(row.get('totalLiabilities', 0)))
                q_equity.append(_safe_num(row.get('totalShareholderEquity', 0)))
                q_revenue.append(_safe_num(row.get('totalRevenue', 0)))
                q_netincome.append(_safe_num(row.get('netIncome', 0)))
                q_costofrevenue.append(_safe_num(row.get('costOfRevenue', 0)))
                q_ebitda.append(_safe_num(row.get('ebitda', 0)))
                q_operatingcashflow.append(_safe_num(row.get('operatingCashflow', 0)))
                q_investmentcashflow.append(_safe_num(row.get('cashflowFromInvestment', 0)))
                q_financingcashflow.append(_safe_num(row.get('cashflowFromFinancing', 0)))
            except Exception as e:
                logging.error(f"Quarterly parse error: {e}")
                continue

    # Now that arrays are parsed, log their sizes
    logging.info(f"[PLOT DEBUG] {ticker} annual x: {len(x)}, assets: {len(y_assets)}, liabilities: {len(y_liabilities)}, equity: {len(y_equity)}")
    logging.info(f"[PLOT DEBUG] {ticker} annual revenue: {len(y_revenue)}, netincome: {len(y_netincome)}, operatingcashflow: {len(y_operatingcashflow)}")
    logging.info(f"[PLOT DEBUG] {ticker} quarterly x: {len(qx)}, assets: {len(q_assets)}, liabilities: {len(q_liabilities)}, equity: {len(q_equity)}")
    logging.info(f"[PLOT DEBUG] {ticker} quarterly revenue: {len(q_revenue)}, netincome: {len(q_netincome)}, operatingcashflow: {len(q_operatingcashflow)}")
    logging.info(f"[PLOT DEBUG] {ticker} shares series counts: top_level={len(shares_dates)}, annual={len(a_shares_dates)}, quarterly={len(q_shares_dates)}")


    # --- Plotting (DRY with plot_group) ---
    # Annual (right column)
    if x:
        plot_group(
            ax1_a, x,
            [(y_assets,'o','tab:blue','Total Assets'),
            (y_liabilities,'x','tab:orange','Total Liabilities'),
            (y_equity,'D','tab:green','Total Shareholder Equity')],
            None,
            None,
            f"{ticker} Annual Balance Sheet",
            reported_currency
        )

        plot_group(
            ax2_a, x,
            [(y_netincome,'^','tab:green','Net Income'),
            (y_revenue,'s','tab:blue','Total Revenue'),
            (y_costofrevenue,'o','tab:orange','Cost of Revenue'),
            (y_ebitda,'d','tab:purple','EBITDA')],
            None,
            None,
            f"{ticker} Annual Income Statement",
            reported_currency
        )

        plot_group(
            ax3_a, x,
            [(y_operatingcashflow,'v','tab:blue','Operating Cashflow'),
            (y_investmentcashflow,'P','tab:orange','Investment Cashflow'),
            (y_financingcashflow,'*','tab:red','Financing Cashflow')],
            None,
            None,
            f"{ticker} Annual Cashflow Statement",
            reported_currency
        )

        # Annual shares outstanding chart — prefer top-level `shares_outstanding` if present
        if shares_dates:
            def shares_auto_scale(values):
                if not values:
                    return 1, ''
                m = max(abs(v) for v in values)
                if m >= 1e10: return 1e9, "Billions"
                if m >= 1e7:  return 1e6, "Millions"
                if m >= 1e4:  return 1e3, "Thousands"
                return 1, ''
            all_vals = shares_basic + shares_diluted
            scale, lbl = shares_auto_scale(all_vals)
            ax4_a.plot(shares_dates, [v/scale for v in shares_basic], marker='o', color='tab:blue', label='Shares Outstanding Basic')
            ax4_a.plot(shares_dates, [v/scale for v in shares_diluted], marker='x', color='tab:orange', label='Shares Outstanding Diluted')
            ax4_a.set_ylabel(f"Value ({lbl})")
            ax4_a.set_title(f"{ticker} Shares Outstanding (Top-level series)")
            ax4_a.legend(loc="best")
        elif a_shares_dates:
            def shares_auto_scale(values, _currency):
                if not values:
                    return 1, ''
                m = max(abs(v) for v in values)
                if m >= 1e10: return 1e9, "Billions"
                if m >= 1e7:  return 1e6, "Millions"
                if m >= 1e4:  return 1e3, "Thousands"
                return 1, ''
            all_vals = a_shares_basic + a_shares_diluted
            scale, lbl = shares_auto_scale(all_vals, None)
            for s, m, c, name in [
                (a_shares_basic,'o','tab:blue','Shares Outstanding Basic'),
                (a_shares_diluted,'x','tab:orange','Shares Outstanding Diluted')]:
                ax4_a.plot(a_shares_dates, [v/scale for v in s], marker=m, color=c, label=name)
            ax4_a.set_ylabel(f"Value ({lbl})")
            ax4_a.set_title(f"{ticker} Annual Shares Outstanding")
            ax4_a.legend(loc="best")

    # Quarterly (left column)
    if qx:
        plot_group(
            ax1_q, qx,
            [(q_assets,'o','tab:blue','Total Assets'),
            (q_liabilities,'x','tab:orange','Total Liabilities'),
            (q_equity,'D','tab:green','Total Shareholder Equity')],
            None,
            None,
            f"{ticker} Quarterly Balance Sheet",
            reported_currency
        )

        plot_group(
            ax2_q, qx,
            [(q_netincome,'^','tab:green','Net Income'),
            (q_revenue,'s','tab:blue','Total Revenue'),
            (q_costofrevenue,'o','tab:orange','Cost of Revenue'),
            (q_ebitda,'d','tab:purple','EBITDA')],
            None,
            None,
            f"{ticker} Quarterly Income Statement",
            reported_currency
        )

        plot_group(
            ax3_q, qx,
            [(q_operatingcashflow,'v','tab:blue','Operating Cashflow'),
            (q_investmentcashflow,'P','tab:orange','Investment Cashflow'),
            (q_financingcashflow,'*','tab:red','Financing Cashflow')],
            None,
            None,
            f"{ticker} Quarterly Cashflow Statement",
            reported_currency
        )

        # Quarterly shares outstanding chart — prefer top-level `shares_outstanding` if present
        if shares_dates:
            def shares_auto_scale(values):
                if not values:
                    return 1, ''
                m = max(abs(v) for v in values)
                if m >= 1e10: return 1e9, "Billions"
                if m >= 1e7:  return 1e6, "Millions"
                if m >= 1e4:  return 1e3, "Thousands"
                return 1, ''
            all_vals = shares_basic + shares_diluted
            scale, lbl = shares_auto_scale(all_vals)
            ax4_q.plot(shares_dates, [v/scale for v in shares_basic], marker='o', color='tab:blue', label='Shares Outstanding Basic')
            ax4_q.plot(shares_dates, [v/scale for v in shares_diluted], marker='x', color='tab:orange', label='Shares Outstanding Diluted')
            ax4_q.set_ylabel(f"Value ({lbl})")
            ax4_q.set_title(f"{ticker} Shares Outstanding (Top-level series)")
            ax4_q.legend(loc="best")
        elif q_shares_dates:
            def shares_auto_scale(values, _currency):
                if not values:
                    return 1, ''
                m = max(abs(v) for v in values)
                if m >= 1e10: return 1e9, "Billions"
                if m >= 1e7:  return 1e6, "Millions"
                if m >= 1e4:  return 1e3, "Thousands"
                return 1, ''
            all_vals = q_shares_basic + q_shares_diluted
            scale, lbl = shares_auto_scale(all_vals, None)
            for s, m, c, name in [
                (q_shares_basic,'o','tab:blue','Shares Outstanding Basic'),
                (q_shares_diluted,'x','tab:orange','Shares Outstanding Diluted')]:
                ax4_q.plot(q_shares_dates, [v/scale for v in s], marker=m, color=c, label=name)
            ax4_q.set_ylabel(f"Value ({lbl})")
            ax4_q.set_title(f"{ticker} Quarterly Shares Outstanding")
            ax4_q.legend(loc="best")

    # --- Shared formatting ---
    for ax in [ax1_q, ax2_q, ax3_q, ax4_q, ax1_a, ax2_a, ax3_a, ax4_a]:
        ax.yaxis.set_major_formatter(mticker.FuncFormatter(lambda x, _: f"{int(x):,}".replace(",", "'")))
    if qx:
        for ax in [ax1_q, ax2_q, ax3_q, ax4_q]:
            ax.set_xticks(qx)
            ax.set_xticklabels([dt.strftime('%d.%m.%Y') for dt in qx], rotation=45, ha='right')
    if x:
        for ax in [ax1_a, ax2_a, ax3_a, ax4_a]:
            ax.set_xticks(x)
            ax.set_xticklabels([dt.strftime('%d.%m.%Y') for dt in x], rotation=45, ha='right')

    fig.tight_layout()
    return fig


def fig_to_png_bytes(fig, dpi=150):
    """Return PNG bytes for a Matplotlib figure."""
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=dpi, bbox_inches='tight')
    buf.seek(0)
    data = buf.getvalue()
    buf.close()
    return data