import { Bell, Settings, User, Search, BarChart3, FileText } from "lucide-react";
import { Button } from "components/ui/Button/Button_new";
import { Input } from "components/ui/input";

interface DashboardHeaderProps {
  ticker?: { symbol: string; name: string };
  marketCap?: string;
  marketCapCurrency?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ ticker, marketCap, marketCapCurrency }) => {
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
        
        <div className="relative ml-[64px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tickers..." 
            className="pl-10 w-80 h-9 bg-background"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Analysis
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
        
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <User className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
};