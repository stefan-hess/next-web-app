import { ArrowRight, Plus, Search, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Button } from "components/ui/Button/Button_new";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "components/ui/dialog";
import { Input } from "components/ui/input";
import type { Ticker } from "./Dashboard";
// removed cn utility import since price/change display was removed

interface GetStartedProps {
  onAddTicker: (ticker: Ticker) => void;
}

const popularTickers: Ticker[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 185.43, change: 2.15, changePercent: 1.17 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 378.85, change: 4.23, changePercent: 1.13 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.87, change: -1.23, changePercent: -0.85 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.91, change: 8.45, changePercent: 3.51 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 481.92, change: -12.45, changePercent: -2.52 },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 147.29, change: 2.87, changePercent: 1.99 }
];

export const GetStarted = ({ onAddTicker }: GetStartedProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredTickers = popularTickers.filter(ticker => 
    ticker.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTicker = (ticker: Ticker) => {
    onAddTicker(ticker);
    setIsDialogOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Welcome to Stock Ticker News</h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            Analyze official financial data, track performance, and make informed investment decisions with comprehensive fundamental analysis.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white">
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Ticker
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Ticker</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for a ticker..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredTickers.map((ticker) => (
                    <Card
                      key={ticker.symbol}
                      className="cursor-pointer hover:bg-muted/50 transition-colors border"
                      onClick={() => handleAddTicker(ticker)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{ticker.symbol}</div>
                            <div className="text-xs text-muted-foreground truncate">{ticker.name}</div>
                          </div>
                          {/* Removed price, change, and change percent from list item UI */}
                          <ArrowRight className="w-4 h-4 ml-3 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Popular Tickers Preview */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Popular Tickers</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {popularTickers.slice(0, 6).map((ticker) => (
              <Card 
                key={ticker.symbol}
                className="cursor-pointer hover:shadow-hover hover:-translate-y-1 transition-all duration-200 bg-gradient-card"
                onClick={() => handleAddTicker(ticker)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{ticker.symbol}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Removed price, change, and change percent from card UI; show name for context */}
                  <div className="text-sm text-muted-foreground truncate">{ticker.name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="pt-8">
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-success-light flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <h3 className="font-semibold">Trusted Data</h3>
              <p className="text-sm text-muted-foreground">Access latest official financial information submitted to regulators and current market data.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-warning-light flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
              <h3 className="font-semibold">Comprehensive Analysis</h3>
              <p className="text-sm text-muted-foreground">Deep dive into balance sheets, income statements, and more.</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Smart Insights</h3>
              <p className="text-sm text-muted-foreground">Get intelligent analysis of performance metrics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};