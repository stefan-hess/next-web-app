
import { BarChart3, Bell, Bot, RefreshCw, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "app/lib/supabaseClient";
import { useQuarterlyReportNotifications } from "app/lib/useQuarterlyReportNotifications";
import { Button } from "components/ui/Button/Button_new";


  // ...existing code...

interface DashboardHeaderProps {
  ticker?: { symbol: string; name: string };
  marketCap?: string;
  marketCapCurrency?: string;
  onOpenAssistant?: () => void;
  onRefreshData?: () => void;
  selectedTickers?: { symbol: string; name: string }[];
  showAssistantButton?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ selectedTickers = [], onOpenAssistant, showAssistantButton, onRefreshData }) => {
  // Scaling logic
  // ...existing code...
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Quarterly report notifications hook
  const { newReports, loading: reportsLoading, markAsRead } = useQuarterlyReportNotifications(
    userEmail,
    selectedTickers.map(t => t.symbol)
  );

  // Fetch user email on mount
  useEffect(() => {
    const fetchUserEmail = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user?.email) {
        setUserEmail(data.user.email);
      }
    };
    fetchUserEmail();
  }, []);
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore AuthSessionMissingError and always redirect
      if (
        typeof e === "object" &&
        e &&
        "name" in e &&
        (e as { name?: string }).name !== "AuthSessionMissingError"
      ) {
        console.error("Logout error:", e);
      }
    }
    window.location.href = "/"; // Redirect to landing page
  }
  return (
    <>
      <div className="block md:hidden w-full bg-yellow-100 text-yellow-900 text-center py-2 px-4 text-sm font-medium border-b border-yellow-300">
        You are currently using the mobile view, for enhanced experience, please use the desktop version.
      </div>
      <header className="sticky top-0 z-30 h-16 bg-[#fdf6ee] border-b border-border flex items-center justify-between px-6 shadow-sm">
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
        {/* Minimal Refresh Widget */}
        {onRefreshData && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onRefreshData}
            aria-label="Refresh Data"
            title="Refresh Data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
        {showAssistantButton && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onOpenAssistant}
            aria-label="Open AI Assistant"
            title="AI Assistant"
          >
            <Bot className="h-4 w-4" />
            AI Assistant
          </Button>
        )}
        <div className="h-4 w-px bg-border mx-2" />
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 relative" 
            onClick={() => setNotificationOpen((open) => !open)}
          >
            <Bell className="h-4 w-4" />
            {newReports.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {newReports.length}
              </span>
            )}
          </Button>
          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded shadow-lg z-50 p-4 max-h-[500px] overflow-y-auto" style={{ backgroundColor: '#fff' }}>
              <h3 className="font-semibold text-sm mb-3">Notifications</h3>
              
              {reportsLoading && (
                <div className="text-xs text-muted-foreground mb-2">Loading quarterly reports…</div>
              )}
              
              {!reportsLoading && newReports.length === 0 && (
                <div className="text-muted-foreground text-sm py-4 text-center">
                  No new quarterly reports for your selected tickers.
                </div>
              )}
              
              {newReports.length > 0 && (
                <ul className="divide-y divide-border">
                  {newReports.map((report) => (
                    <li key={`${report.ticker}-${report.fiscalDateEnding}`} className="py-3 flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium text-sm">{report.ticker}</span>
                        <p className="text-xs text-muted-foreground mt-1">
                          New quarterly report for fiscal period ending{' '}
                          <span className="font-semibold">{report.fiscalDateEnding}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => markAsRead(report.ticker, report.fiscalDateEnding)}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline flex-shrink-0"
                      >
                        Dismiss
                      </button>
                    </li>
                  ))}
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
    </>
  );
};