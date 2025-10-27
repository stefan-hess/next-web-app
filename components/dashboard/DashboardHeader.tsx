import { Bell, Settings, User, BarChart3, FileText } from "lucide-react";
import { Button } from "components/ui/Button/Button_new";
import { supabase } from "app/lib/supabaseClient";
import { useState } from "react";

interface DashboardHeaderProps {
  ticker?: { symbol: string; name: string };
  marketCap?: string;
  marketCapCurrency?: string;
  onOpenCommentariesSidebar?: () => void; // Add prop
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ ticker, marketCap, marketCapCurrency, onOpenCommentariesSidebar }) => {
  // Scaling logic
  function autoScale(values: string[], currency: string) {
    const nums = values.map(v => {
      const n = Number(v.replace(/,/g, ""));
      return isNaN(n) ? 0 : Math.abs(n);
    });
    const m = Math.max(...nums, 0);
    if (m >= 1e10) return { scale: 1e9, label: `Billions ${currency}` };
    if (m >= 1e7)  return { scale: 1e6, label: `Millions ${currency}` };
    if (m >= 1e4)  return { scale: 1e3, label: `Thousands ${currency}` };
    return { scale: 1, label: currency };
  }
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-4 w-4" />
        </Button>
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
            <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded shadow-lg z-50">
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