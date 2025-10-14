import os, requests, logging, sys, json

def fetch_dividend_history_data(tickers, max_dividends=50):
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
            dividends = data.get("data", [])[:max_dividends]
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

def main(tickers, max_dividends=100):
    result = fetch_dividend_history_data(tickers, max_dividends)
    return result

if __name__ == "__main__":
    # Usage: python fetch_dividend_data.py TICKER [max_dividends]
    import sys
    import json
    ticker = sys.argv[1]
    max_dividends = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    output = main([ticker], max_dividends)
    print(json.dumps(output))