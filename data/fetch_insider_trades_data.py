import os, requests, logging, sys, json

def fetch_latest_insider_trades(tickers, max_trades=100):
    
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
            trades = data.get("data", [])[:max_trades]
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


# API-callable main function
def main(tickers, max_trades=100):
    """
    API entry point. Returns a flat list of insider trades for all tickers.
    Args:
        tickers (list): List of ticker symbols.
        max_trades (int): Max trades per ticker.
    Returns:
        List[dict]: List of insider trade dicts with ticker included.
    """
    result = fetch_latest_insider_trades(tickers, max_trades)
    trades_list = []
    for ticker, trades in result.items():
        if trades:
            for trade in trades:
                trade_with_ticker = dict(trade)
                trade_with_ticker['ticker'] = ticker
                trades_list.append(trade_with_ticker)
    return trades_list

if __name__ == "__main__":
    import sys
    import json
    # Accept tickers as a comma-separated string or as individual arguments
    if len(sys.argv) > 1:
        # If called as: python script.py AAPL MSFT
        tickers = sys.argv[1:]
    else:
        tickers = []
    output = main(tickers)
    print(json.dumps(output))