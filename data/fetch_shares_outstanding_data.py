import os, requests, logging, sys, json
from datetime import datetime

def fetch_shares_outstanding_data(tickers):
    logging.info(f"Fetching shares outstanding for tickers: {tickers}")
    api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
    if not api_key:
        raise ValueError("ALPHA_VANTAGE_API_KEY is not set in environment variables.")

    shares_outstanding_data = {}
    for ticker in tickers:
        # Fetch shares outstanding
        url = f"https://www.alphavantage.co/query?function=SHARES_OUTSTANDING&symbol={ticker}&apikey={api_key}"
        shares_dates = set()
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            shares_list = []
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
                        shares_dates.add(date)
            else:
                from datetime import date as dtdate
                today_date = str(dtdate.today())
                shares_list.append({
                    "date": today_date,
                    "shares_outstanding_basic": data.get("shares_outstanding_basic"),
                    "shares_outstanding_diluted": data.get("shares_outstanding_diluted")
                })
                shares_dates.add(today_date)
            shares_outstanding_data[ticker] = shares_list
        except Exception as e:
            logging.error(f"Error fetching shares outstanding for {ticker}: {e}")
            shares_outstanding_data[ticker] = None
            shares_dates = set()

        # Fetch monthly stock prices
        price_url = f"https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol={ticker}&apikey={api_key}"
        try:
            price_response = requests.get(price_url, timeout=10)
            price_response.raise_for_status()
            price_data = price_response.json()
            monthly_series = price_data.get("Monthly Time Series", {})
            # Map date to close price for quick lookup
            close_price_by_date = {date: float(values.get("4. close", 0)) for date, values in monthly_series.items()}
            # Also map parsed date objects for +/- 5 day matching
            monthly_dt_price = {}
            for dstr, close_val in close_price_by_date.items():
                try:
                    monthly_dt_price[datetime.strptime(dstr, "%Y-%m-%d").date()] = close_val
                except Exception:
                    # Skip unparsable dates
                    continue

            # Add market cap to shares_outstanding_data for dates within +/- 5 days of month-end
            entries = shares_outstanding_data.get(ticker) or []
            for entry in entries:
                date_str = entry.get("date")
                close_price = None
                try:
                    entry_dt = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else None
                except Exception:
                    entry_dt = None

                if entry_dt is not None:
                    # Find monthly date within +/- 10 days
                    candidates = [md for md in monthly_dt_price.keys() if abs((md - entry_dt).days) <= 10]
                    if candidates:
                        # Pick closest by absolute difference
                        best_md = min(candidates, key=lambda md: abs((md - entry_dt).days))
                        close_price = monthly_dt_price.get(best_md)
                else:
                    # Fallback to exact string match if parsing fails
                    close_price = close_price_by_date.get(date_str)
                try:
                    basic = float(entry.get("shares_outstanding_basic", 0) or 0)
                    diluted = float(entry.get("shares_outstanding_diluted", 0) or 0)
                except Exception:
                    basic = 0
                    diluted = 0
                if close_price is not None:
                    entry["market_cap_undiluted"] = basic * close_price
                    entry["market_cap_diluted"] = diluted * close_price
                else:
                    entry["market_cap_undiluted"] = None
                    entry["market_cap_diluted"] = None
        except Exception as e:
            logging.error(f"Error fetching monthly prices for {ticker}: {e}")
            # Swallow error for monthly prices; market cap will be None if price missing

    for ticker in tickers:
        logging.info(f"Fetched shares outstanding and monthly prices for {ticker}.")
    return {"shares_outstanding": shares_outstanding_data}

def main(tickers):
    result = fetch_shares_outstanding_data(tickers)
    return result

if __name__ == "__main__":
    # Usage: python fetch_shares_outstanding_data.py TICKER
    import sys, json
    ticker = sys.argv[1]
    output = main([ticker])
    print(json.dumps(output, indent=2))