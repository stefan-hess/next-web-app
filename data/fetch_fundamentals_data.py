from html import escape
import os
import pandas as pd
import requests
import logging
from pprint import pformat

# Number of quarters and years to fetch
fetched_quarters = 12
fetched_years = 10

# Number of last dividend payments to fetch
fetched_dividends = 10

# Number of last insider trades to fetch
fetched_insider_trades = 20


def fetch_market_cap_and_name(tickers):
    logging.info(f"Fetching market cap for tickers: {tickers}")
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    if not api_key:
        raise ValueError("ALPHA_VANTAGE_API_KEY is not set in environment variables.")
    market_cap_name_data = {}
    for ticker in tickers:
        url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={ticker}&apikey={api_key}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            market_cap = data.get("MarketCapitalization")
            name = data.get("Name")
            currency = data.get("Currency")
            market_cap_name_data[ticker] = {
                "MarketCapitalization": market_cap,
                "Name": name,
                "Currency": currency
            }
        except Exception as e:
            logging.error(f"Error fetching market cap for {ticker}: {e}")
            market_cap_name_data[ticker] = None
    return market_cap_name_data

def fetch_latest_insider_trades(tickers):
    
    def total_traded_value(shares, share_price):
        try:
            s = float(shares)
            p = float(share_price)
            return s * p
        except (TypeError, ValueError):
            return None
    
    logging.info(f"Fetching latest insider trades for tickers: {tickers}")
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    if not api_key:
        raise ValueError("ALPHA_VANTAGE_API_KEY is not set in environment variables.")

    insider_trades_data = {}
    for ticker in tickers:
        url = f"https://www.alphavantage.co/query?function=INSIDER_TRANSACTIONS&symbol={ticker}&apikey={api_key}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            trades = data.get("data", [])[:fetched_insider_trades]
            insider_trades_data[ticker] = [
                {
                    "transaction_date": t.get("transaction_date"),
                    "executive": t.get("executive"),
                    "executive_title": t.get("executive_title"),
                    "security_type": t.get("security_type"),
                    "acquisition_or_disposal": t.get("acquisition_or_disposal"),
                    "shares": t.get("shares"),
                    "share_price": t.get("share_price"),
                    "total_value": total_traded_value(t.get("shares"), t.get("share_price"))
                }
                for t in trades
            ]
        except Exception as e:
            logging.error(f"Error fetching insider trades for {ticker}: {e}")
            insider_trades_data[ticker] = None
    for ticker in tickers:
        logging.info(f"Fetched insider trades for {ticker}.")
    return insider_trades_data

def insider_trades_to_html(insider_trades_data):
    """
    Returns a compact, mobile-friendly HTML table string
    for inclusion in an email.
    """
    if not insider_trades_data:
        return "<p>No insider trades available.</p>"

    rows = []
    for ticker, trades in insider_trades_data.items():
        if not trades:
            rows.append(f"<tr><td colspan='8'><b>{escape(ticker)}</b>: No data</td></tr>")
            continue

        # Add a header row for each ticker
        rows.append(
            f"<tr style='background:#f0f0f0;'>"
            f"<td colspan='8' style='font-weight:bold;text-align:center;'>{escape(ticker)}</td>"
            f"</tr>"
        )

        for t in trades:
            # Calculate total value if possible
            shares = t.get('shares')
            price = t.get('share_price')
            try:
                total = float(shares) * float(price)
                # If price or shares is zero, or not meaningful, display N/A
                if total == 0 or price in [None, '', 0, '0.0', '0']:
                    total_display = 'N/A'
                else:
                    total_display = f"{total:,.2f}"
            except (TypeError, ValueError):
                total_display = 'N/A'

            rows.append(
                "<tr>"
                f"<td>{escape(t.get('transaction_date') or '')}</td>"
                f"<td>{escape(t.get('executive') or '')}</td>"
                f"<td>{escape(t.get('executive_title') or '')}</td>"
                f"<td>{escape(t.get('security_type') or '')}</td>"
                f"<td>{escape(t.get('acquisition_or_disposal') or '')}</td>"
                f"<td style='text-align:right;'>{shares if shares is not None else ''}</td>"
                f"<td style='text-align:right;'>{price if price is not None else ''}</td>"
                f"<td style='text-align:right;'>{total_display}</td>"
                "</tr>"
            )

    html = (
        "<h4 style='margin-bottom:8px;margin-top:18px;'>Latest Insider trades</h4>"
        "<table style='width:100%;border-collapse:collapse;font-family:sans-serif;font-size:12px;'>"
        "<thead>"
        "<tr style='background:#333;color:#fff;'>"
        "<th style='padding:6px;border:1px solid #ccc;'>Date</th>"
        "<th style='padding:6px;border:1px solid #ccc;'>Executive</th>"
        "<th style='padding:6px;border:1px solid #ccc;'>Title</th>"
        "<th style='padding:6px;border:1px solid #ccc;'>Security</th>"
        "<th style='padding:6px;border:1px solid #ccc;'>Action (Acquisition / Disposal)</th>"
        "<th style='padding:6px;border:1px solid #ccc;'>No of Shares</th>"
        "<th style='padding:6px;border:1px solid #ccc;'>Price</th>"
        "<th style='padding:6px;border:1px solid #ccc;'>Total Trade Value</th>"
        "</tr>"
        "</thead>"
        "<tbody>"
        + "".join(rows) +
        "</tbody></table>"
    )
    return html

# Fetch balance sheet data for a list of tickers
def fetch_balance_sheet_data(tickers):
    logging.info(f"Fetching balance sheet data for tickers: {tickers}")
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    if not api_key:
        raise ValueError("ALPHA_VANTAGE_API_KEY is not set in environment variables.")
    balance_sheet_data = {}
    for ticker in tickers:
        url = f"https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol={ticker}&apikey={api_key}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()

            # Extract last quarters
            quarterly = data.get("quarterlyReports", [])[:fetched_quarters]
            quarterly_summary = [
                {
                    "fiscalDateEnding": q.get("fiscalDateEnding"),
                    "reportedCurrency": q.get("reportedCurrency"),
                    "totalAssets": q.get("totalAssets"),
                    "totalLiabilities": q.get("totalLiabilities"),
                    "totalShareholderEquity": q.get("totalShareholderEquity")
                }
                for q in quarterly
            ]

            # Extract last years
            annual = data.get("annualReports", [])[:fetched_years]
            annual_summary = [
                {
                    "fiscalDateEnding": a.get("fiscalDateEnding"),
                    "reportedCurrency": a.get("reportedCurrency"),
                    "totalAssets": a.get("totalAssets"),
                    "totalLiabilities": a.get("totalLiabilities"),
                    "totalShareholderEquity": a.get("totalShareholderEquity")
                }
                for a in annual
            ]

            balance_sheet_data[ticker] = {
                "quarterly": quarterly_summary,
                "annual": annual_summary
            }
            # Log first few values for each ticker
            logging.info(f"Balance sheet for {ticker} (annual, first 2): {annual_summary[:2]}")
            logging.info(f"Balance sheet for {ticker} (quarterly, first 2): {quarterly_summary[:2]}")
        except Exception as e:
            logging.error(f"Error fetching balance sheet for {ticker}: {e}")
            balance_sheet_data[ticker] = None
    for ticker in tickers:
        logging.info(f"Fetched balance sheet data for {ticker}.")
    return balance_sheet_data


# Fetch income statement data for a list of tickers
def fetch_income_statement_data(tickers):
    logging.info(f"Fetching income statement data for tickers: {tickers}")
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    if not api_key:
        raise ValueError("ALPHA_VANTAGE_API_KEY is not set in environment variables.")

    income_statement_data = {}
    for ticker in tickers:
        url = f"https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol={ticker}&apikey={api_key}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()

            # Extract last 4 quarters
            quarterly = data.get("quarterlyReports", [])[:fetched_quarters]
            quarterly_summary = [
                {
                    "fiscalDateEnding": q.get("fiscalDateEnding"),
                    "reportedCurrency": q.get("reportedCurrency"),
                    "totalRevenue": q.get("totalRevenue"),
                    "costOfRevenue": q.get("costOfRevenue"),
                    "ebitda": q.get("ebitda"),
                    "netIncome": q.get("netIncome")
                }
                for q in quarterly
            ]

            # Extract last 5 years
            annual = data.get("annualReports", [])[:fetched_years]
            annual_summary = [
                {
                    "fiscalDateEnding": a.get("fiscalDateEnding"),
                    "reportedCurrency": a.get("reportedCurrency"),
                    "totalRevenue": a.get("totalRevenue"),
                    "costOfRevenue": a.get("costOfRevenue"),
                    "ebitda": a.get("ebitda"),
                    "netIncome": a.get("netIncome")
                }
                for a in annual
            ]

            income_statement_data[ticker] = {
                "quarterly": quarterly_summary,
                "annual": annual_summary
            }
        except Exception as e:
            logging.error(f"Error fetching income statement for {ticker}: {e}")
            income_statement_data[ticker] = None

    for ticker in tickers:
        logging.info(f"Fetched income statement data for {ticker}.")
    return income_statement_data



# Fetch cashflow data for a list of tickers
def fetch_cashflow_data(tickers):
    logging.info(f"Fetching cashflow data for tickers: {tickers}")
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    if not api_key:
        raise ValueError("ALPHA_VANTAGE_API_KEY is not set in environment variables.")

    cashflow_data = {}
    for ticker in tickers:
        url = f"https://www.alphavantage.co/query?function=CASH_FLOW&symbol={ticker}&apikey={api_key}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()

            # Extract last quarters
            quarterly = data.get("quarterlyReports", [])[:fetched_quarters]
            quarterly_summary = [
                {
                    "fiscalDateEnding": q.get("fiscalDateEnding"),
                    "reportedCurrency": q.get("reportedCurrency"),
                    "operatingCashflow": q.get("operatingCashflow"),
                    "cashflowFromInvestment": q.get("cashflowFromInvestment"),
                    "cashflowFromFinancing": q.get("cashflowFromFinancing")
                }
                for q in quarterly
            ]

            # Extract last years
            annual = data.get("annualReports", [])[:fetched_years]
            annual_summary = [
                {
                    "fiscalDateEnding": a.get("fiscalDateEnding"),
                    "reportedCurrency": a.get("reportedCurrency"),
                    "operatingCashflow": a.get("operatingCashflow"),
                    "cashflowFromInvestment": a.get("cashflowFromInvestment"),
                    "cashflowFromFinancing": a.get("cashflowFromFinancing")
                }
                for a in annual
            ]

            cashflow_data[ticker] = {
                "quarterly": quarterly_summary,
                "annual": annual_summary
            }
        except Exception as e:
            logging.error(f"Error fetching cashflow for {ticker}: {e}")
            cashflow_data[ticker] = None
    for ticker in tickers:
        logging.info(f"Fetched cashflow data for {ticker}.")
    return cashflow_data


# Fetch shares outstanding data for a list of tickers
def fetch_shares_outstanding_data(tickers):
    logging.info(f"Fetching shares outstanding for tickers: {tickers}")
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    if not api_key:
        raise ValueError("ALPHA_VANTAGE_API_KEY is not set in environment variables.")

    shares_outstanding_data = {}
    for ticker in tickers:
        url = f"https://www.alphavantage.co/query?function=SHARES_OUTSTANDING&symbol={ticker}&apikey={api_key}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            # Try to extract time series if available, else fallback to single value
            shares_list = []
            # If API returns a list under 'data', use that
            if "data" in data and isinstance(data["data"], list):
                for entry in data["data"]:
                    date = entry.get("date")
                    basic = entry.get("shares_outstanding_basic")
                    diluted = entry.get("shares_outstanding_diluted")
                    if date:
                        shares_list.append({
                            "date": date,
                            "shares_outstanding_basic": basic,
                            "shares_outstanding_diluted": diluted
                        })
            else:
                # Fallback: single value, use today's date
                from datetime import date as dtdate
                shares_list.append({
                    "date": str(dtdate.today()),
                    "shares_outstanding_basic": data.get("shares_outstanding_basic"),
                    "shares_outstanding_diluted": data.get("shares_outstanding_diluted")
                })
            shares_outstanding_data[ticker] = shares_list
        except Exception as e:
            logging.error(f"Error fetching shares outstanding for {ticker}: {e}")
            shares_outstanding_data[ticker] = None
    for ticker in tickers:
        logging.info(f"Fetched shares outstanding for {ticker}.")
    return shares_outstanding_data

def fetch_dividend_history_data(tickers):
    logging.info(f"Fetching dividend history for tickers: {tickers}")
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    if not api_key:
        raise ValueError("ALPHA_VANTAGE_API_KEY is not set in environment variables.")

    dividend_history_data = {}
    for ticker in tickers:
        url = f"https://www.alphavantage.co/query?function=DIVIDENDS&symbol={ticker}&apikey={api_key}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            # The output format is typically: {"symbol": "IBM", "data": [ ... ]}
            dividends = data.get("data", [])[:fetched_dividends]
            # Only keep the required fields for each dividend
            dividend_history_data[ticker] = [
                {
                    "ex_dividend_date": d.get("ex_dividend_date"),
                    "declaration_date": d.get("declaration_date"),
                    "record_date": d.get("record_date"),
                    "payment_date": d.get("payment_date"),
                    "amount": d.get("amount")
                }
                for d in dividends
            ]
        except Exception as e:
            logging.error(f"Error fetching dividend history for {ticker}: {e}")
            dividend_history_data[ticker] = None
    for ticker in tickers:
        logging.info(f"Fetched dividend history for {ticker}.")
    return dividend_history_data

def prepare_fundamentals_data_for_plotting(balance_sheet, income_statement, cashflow, shares_outstanding=None):
    logging.info("Preparing fundamentals data for plotting.")
    """
    Prepares and merges all fetched fundamental data into a single structured dictionary for plotting.
    Returns: dict[ticker] = {'annual': [...], 'quarterly': [...]}
    """
    plot_data = {}
    for ticker in balance_sheet.keys():
        annual = []
        quarterly = []
        # Merge annual data
        bs_annual = balance_sheet.get(ticker, {}).get('annual', [])
        inc_annual = income_statement.get(ticker, {}).get('annual', [])
        cf_annual = cashflow.get(ticker, {}).get('annual', [])
        for i in range(max(len(bs_annual), len(inc_annual), len(cf_annual))):
            entry = {}
            if i < len(bs_annual):
                entry.update(bs_annual[i])
            if i < len(inc_annual):
                entry.update(inc_annual[i])
            if i < len(cf_annual):
                entry.update(cf_annual[i])
            annual.append(entry)
        # Merge quarterly data
        bs_quarterly = balance_sheet.get(ticker, {}).get('quarterly', [])
        inc_quarterly = income_statement.get(ticker, {}).get('quarterly', [])
        cf_quarterly = cashflow.get(ticker, {}).get('quarterly', [])
        for i in range(max(len(bs_quarterly), len(inc_quarterly), len(cf_quarterly))):
            entry = {}
            if i < len(bs_quarterly):
                entry.update(bs_quarterly[i])
            if i < len(inc_quarterly):
                entry.update(inc_quarterly[i])
            if i < len(cf_quarterly):
                entry.update(cf_quarterly[i])
            quarterly.append(entry)
        plot_data[ticker] = {
            "annual": annual,
            "quarterly": quarterly
        }
    return plot_data

if __name__ == "__main__":
    import sys, json
    ticker = sys.argv[1]
    # Fetch all required data for the ticker
    balance_sheet = fetch_balance_sheet_data([ticker])
    income_statement = fetch_income_statement_data([ticker])
    cashflow = fetch_cashflow_data([ticker])
    # Prepare the output
    result = prepare_fundamentals_data_for_plotting(balance_sheet, income_statement, cashflow)
    print(json.dumps(result))