
import { BarChart3, Bell, FileText, Settings, User } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "app/lib/supabaseClient";
import { Button } from "components/ui/Button/Button_new";

// Public env for client-side fallback fetches (safe: NEXT_PUBLIC_*)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export interface DashboardHeaderProps {
  ticker?: { symbol: string; name: string };
  marketCap?: string;
  marketCapCurrency?: string;
  onOpenCommentariesSidebar?: () => void;
  selectedTickers?: { symbol: string; name: string }[];
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onOpenCommentariesSidebar, selectedTickers = [] }) => {
  // Scaling logic
  // ...existing code...
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [latestComments, setLatestComments] = useState<Record<string, { alias: string; timestamp: string } | null>>({});
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    async function fetchLatestComments() {
      if (!selectedTickers.length) return;
      setLoadingNotifications(true);
      const results: Record<string, { alias: string; timestamp: string } | null> = {};
      try {
        // Fetch each ticker in parallel against PostgREST with explicit apikey param and headers
        const promises = selectedTickers.map(async (ticker) => {
          const symbol = (ticker.symbol || '').trim();
          if (!supabaseUrl || !supabaseAnonKey) {
            console.debug('[Notifications] Missing Supabase env vars');
            return { symbol, value: null };
          }
          try {
            const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/ticker_commentaries`);
            url.searchParams.set('select', 'created_by,created_at');
            url.searchParams.set('related_ticker', `ilike.${symbol}`);
            url.searchParams.set('order', 'created_at.desc');
            url.searchParams.set('limit', '1');
            // Append apikey query param to satisfy environments that strip headers
            url.searchParams.set('apikey', supabaseAnonKey);
            const resp = await fetch(url.toString(), {
              headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
              },
            });
            if (!resp.ok) {
              console.debug('[Notifications] REST fetch failed', { symbol, status: resp.status });
              return { symbol, value: null };
            }
            const rows = (await resp.json()) as Array<Record<string, any>>;
            if (!rows?.length) return { symbol, value: null };
            const r = rows[0] || {};
            return {
              symbol,
              value: {
                alias: typeof r.created_by === 'string' ? r.created_by : 'none',
                timestamp: typeof r.created_at === 'string' ? new Date(r.created_at).toLocaleString() : 'none',
              },
            };
          } catch (e) {
            console.debug('[Notifications] REST fetch error', { symbol, e });
            return { symbol, value: null };
          }
        });
        const all = await Promise.all(promises);
        for (const { symbol, value } of all) {
          results[symbol] = value;
        }
        setLatestComments(results);
      } finally {
        setLoadingNotifications(false);
      }
    }
    if (notificationOpen) {
      fetchLatestComments();
    }
  }, [selectedTickers, notificationOpen, refreshTick]);
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/"; // Redirect to landing page
  }
  return (
    <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-medium text-foreground">
              StockTickerNews
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2" onClick={onOpenCommentariesSidebar}>
          <BarChart3 className="h-4 w-4" />
          Discussions
        </Button>
        <Button variant="ghost" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          Reports
        </Button>
        <div className="h-4 w-px bg-border mx-2" />
        <div className="relative">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setNotificationOpen((open) => !open)}>
            <Bell className="h-4 w-4" />
          </Button>
          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded shadow-lg z-50 p-4" style={{ backgroundColor: '#fff' }}>
              {loadingNotifications && (
                <div className="text-xs text-muted-foreground mb-2">Loading latest activity…</div>
              )}
              {selectedTickers.length === 0 ? (
                <div className="text-muted-foreground">No tickers selected.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {selectedTickers.map((ticker) => {
                    const comment = latestComments[ticker.symbol];
                    return (
                      <li key={ticker.symbol} className="py-2 flex flex-col">
                        <span className="font-medium">{ticker.symbol} - {ticker.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Last comment: {comment ? `${comment.alias} @ ${comment.timestamp}` : 'none'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
        </Button>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setDropdownOpen((open: boolean) => !open)}
            aria-label="User menu"
          >
            <User className="h-4 w-4" />
          </Button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded shadow-lg z-50" style={{ backgroundColor: '#fff' }}>
              <button
                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted-foreground/10"
                onClick={handleLogout}
              >Log Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};