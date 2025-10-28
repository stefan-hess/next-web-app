"use client";



import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "app/lib/supabaseClient";
import { cn } from "app/lib/utils";
import { Button } from "components/ui/Button/Button_new";
import { Dialog, DialogContent, DialogHeader, DialogOverlay, DialogTitle, DialogTrigger } from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "components/ui/sidebar";
import type { Ticker } from "./Dashboard";

export interface DashboardSidebarProps {
  tickers: Ticker[];
  activeTicker: string;
  onTickerSelect: (symbol: string) => void;
  onTickerRemove: (symbol: string) => void;
  onAddTicker: (ticker: Ticker) => void;
  email: string;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  tickers,
  activeTicker,
  onTickerSelect,
  onTickerRemove,
  onAddTicker,
  email,
}) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [allowedTickers, setAllowedTickers] = useState<string[]>([]);

  // NEW: results + loading for Alpha Vantage search
  const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string }>>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  /** Load tickers that this user is allowed to see */
  useEffect(() => {
    async function fetchAllowedTickers() {
      if (!email) return;
      const { data, error } = await supabase
        .from("ticker_selection_clients")
        .select("ticker")
        .eq("email", email);
      if (error) {
        console.error("Error fetching allowed tickers:", error);
        setAllowedTickers([]);
        return;
      }
      setAllowedTickers(
        data?.map((row: { ticker: string }) => row.ticker) || []
      );
    }
    fetchAllowedTickers();
  }, [email]);

  /** Alpha Vantage search when user types */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const controller = new AbortController();
    const delay = setTimeout(async () => {
      try {
        setLoadingResults(true);
        const res = await fetch(
          `/api/search-ticker?query=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal }
        );
        const json = (await res.json()) as { bestMatches?: Array<{ [key: string]: string }> };
        const matches = (json.bestMatches || []).map((m: { [key: string]: string }) => ({
          symbol: m["1. symbol"] ?? "",
          name: m["2. name"] ?? "",
        }));
        setSearchResults(matches);
      } catch (err) {
        if (!(err instanceof DOMException)) {
          console.error("Search error:", err);
        }
      } finally {
        setLoadingResults(false);
      }
    }, 400); // debounce
    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [searchQuery]);

  const handleAddTicker = (ticker: Ticker) => {
    // Redirect to login if user is not authenticated
    if (!email) {
      router.push("/login");
      return;
    }
    // Prevent duplicate insert
    supabase
      .from("ticker_selection_clients")
      .select("ticker")
      .eq("email", email)
      .eq("ticker", ticker.symbol)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error checking for existing ticker:", error);
          return;
        }
        if (data && data.length > 0) {
          console.warn("Ticker already exists for user, not inserting.")
          return;
        }
        supabase
          .from("ticker_selection_clients")
          .insert([{ ticker: ticker.symbol, name: ticker.name, email }])
          .then(({ error }) => {
            if (error) {
              console.error("Error inserting ticker into DB:", error);
            }
          });
      });
    onAddTicker(ticker);
    setIsAddDialogOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveTicker = async (symbol: string) => {
    if (!email) return;
    const { error } = await supabase
      .from("ticker_selection_clients")
      .delete()
      .eq("email", email)
      .eq("ticker", symbol);
    if (error) {
      console.error("Error deleting ticker from DB:", error);
    }
    onTickerRemove(symbol);
  };

  /** Only show tickers that are present in allowedTickers */
  const filteredTickers = tickers.filter((t) =>
    allowedTickers.includes(t.symbol)
  );

  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarHeader className="p-6 border-b border-border">
        <div className="h-16" />
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            if (open && !email) {
              // Redirect to login instead of opening the dialog
              router.push("/login");
              return;
            }
            setIsAddDialogOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Ticker
            </Button>
          </DialogTrigger>
          <DialogOverlay className="fixed inset-0 bg-black/60" />
          <DialogContent
            className="sm:max-w-md bg-[#f6f0e9] p-6 min-h-[300px] min-w-[340px] rounded-lg shadow-lg"
          >
            <DialogHeader>
            <DialogTitle>Add New Ticker</DialogTitle>
            </DialogHeader>

            {/* Search input */}
            <div className="mb-4">
              <Input
                placeholder="Search tickers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 text-base align-middle"
              />
            </div>

            {/* Search results */}
            {loadingResults && (
              <p className="text-sm text-gray-500">Searching…</p>
            )}
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.map((res) => (
                <div
                  key={res.symbol}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                  onClick={() =>
                    handleAddTicker({
                      symbol: res.symbol,
                      name: res.name,
                      price: 0,
                      change: 0,
                      changePercent: 0,
                    })
                  }
                >
                  <div>
                    <div className="font-medium">{res.symbol}</div>
                    <div className="text-xs text-gray-500">{res.name}</div>
                  </div>
                </div>
              ))}
              {!loadingResults && searchQuery && searchResults.length === 0 && (
                <p className="text-sm text-gray-500">No matches found.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </SidebarHeader>

      <SidebarContent className="px-4 py-2">
        <SidebarMenu>
          {filteredTickers.map((ticker) => (
            <SidebarMenuItem key={ticker.symbol}>
              <SidebarMenuButton
                onClick={() => onTickerSelect(ticker.symbol)}
                className={cn(
                  "w-full justify-between group hover:bg-sidebar-hover transition-colors p-3 h-auto",
                  activeTicker === ticker.symbol &&
                    "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-sm">
                    {ticker.symbol}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center cursor-pointer"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleRemoveTicker(ticker.symbol);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};