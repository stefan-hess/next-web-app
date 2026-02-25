import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Routes under /api that do not require an authenticated session
const PUBLIC_API_PREFIXES = [
  "/api/webhook",
  "/api/create-checkout-session",
  "/api/signup-and-subscribe",
  "/api/search-ticker",
  "/api/search_tickers",
  "/api/health",
  "/api/contact",
  "/api/data/fundamentals_data",
  "/api/data/insider_trades_data",
  "/api/data/dividend_data",
  "/api/data/sentiment_data",
  "/api/data/shares_outstanding_data",
  "/api/data/check-quarterly-reports",
  "/api/get-stripe-plan",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes through without auth check
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
