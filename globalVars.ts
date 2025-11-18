// Centralized global variable names for API and page usage
// Update these values to change variable names across the project

export const GLOBAL_VARS = {
  // Database table names
  TABLE_NEWS_SUBSCRIBED_CLIENTS: "news_subscribed_clients",
  TABLE_TICKER_SELECTION_CLIENTS: "ticker_selection_clients",
  TABLE_FEEDBACK: "feedback",

  // Column names
  COL_FIRST_NAME: "first_name",
  COL_LAST_NAME: "last_name",
  COL_EMAIL: "email",
  COL_TICKERS: "tickers",
  COL_FEEDBACK: "feedback",
  COL_STRIPE_PLAN: "stripe_plan",
  COL_SUBSCRIPTION_CANCELLED: "subscription_cancelled",

  // Plan names
  PLAN_FREE: "free",
  PLAN_MUNGER: "Munger",
  PLAN_BUFFETT: "Buffett",

  // Stripe price-id mapping for plans
  PRICE_ID_MAP: {
    Munger: "price_1SUKHjI8pTUJRz6FPUH0K3WB",
    Buffett: "price_1SUKGzI8pTUJRz6F7Fxr4emS",
    Graham: "price_graham" // TODO: Replace with real price ID if needed
  },

  // fetched fundamental years
  FETCHED_FUNDAMENTAL_YEARS: 20,
  FETCHED_FUNDAMENTAL_QUARTERS: 12,

  // Other global constants can be added here
  STRIPE_API_VERSION: "2025-08-27.basil"
}

