import os, requests, logging, sys, json

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
            else:
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

def main(tickers):
    result = fetch_shares_outstanding_data(tickers)
    return result

if __name__ == "__main__":
    # Usage: python fetch_shares_outstanding_data.py TICKER
    import sys, json
    ticker = sys.argv[1]
    output = main([ticker])
    print(json.dumps(output))