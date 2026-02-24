const TICKER_REGEX = /^[A-Z0-9.\-]{1,12}$/;

export function isValidTicker(ticker: string): boolean {
  return TICKER_REGEX.test(ticker.toUpperCase().trim());
}
