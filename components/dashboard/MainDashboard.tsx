import { useState } from "react";
import { useCachedFinancialData } from "app/lib/useCachedFinancialData";
import { DollarSign, BarChart3, PieChart, Activity } from "lucide-react";
import { FinancialCard } from "./FinancialCard";
import type { Ticker } from "./Dashboard";

interface MainDashboardProps {
  ticker: Ticker;
  marketCap?: string;
  marketCapCurrency?: string;
}

export const MainDashboard = ({ ticker, marketCap, marketCapCurrency }: MainDashboardProps) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [period, setPeriod] = useState<'annual' | 'quarterly'>('annual');
  const [view, setView] = useState<'table' | 'chart'>('table');
  const { data, loading, error } = useCachedFinancialData(ticker.symbol);
  const periodData = data?.[ticker.symbol]?.[period] || [];

  // Use periodData for your cards
  const financialCategories = [
    {
      id: "balance-sheet",
      title: "Balance Sheet",
      icon: BarChart3,
      color: "primary",
      data: periodData.map((p: Record<string, string>) => ({
        reportedCurrency: p.reportedCurrency ?? "",
        fiscalDateEnding: p.fiscalDateEnding ?? "",
        totalAssets: p.totalAssets ?? "",
        totalLiabilities: p.totalLiabilities ?? "",
        shareholderEquity: p.totalShareholderEquity ?? "",
      })),
    },
    {
      id: "income-statement",
      title: "Income Statement",
      icon: DollarSign,
      color: "success",
      data: periodData.map((p: Record<string, string>) => ({
        reportedCurrency: p.reportedCurrency ?? "",
        fiscalDateEnding: p.fiscalDateEnding ?? "",
        totalRevenue: p.totalRevenue ?? "",
        costOfRevenue: p.costOfRevenue ?? "",
        ebitda: p.ebitda ?? "",
        netIncome: p.netIncome ?? "",
      })),
    },
    {
      id: "cash-flow",
      title: "Cash Flow",
      icon: Activity,
      color: "warning",
      data: periodData.map((p: Record<string, string>) => ({
        reportedCurrency: p.reportedCurrency ?? "",
        fiscalDateEnding: p.fiscalDateEnding ?? "",
        operatingCashflow: p.operatingCashflow ?? "",
        cashflowFromInvestment: p.cashflowFromInvestment ?? "",
        cashflowFromFinancing: p.cashflowFromFinancing ?? "",
      })),
    },
  ];

  /**
   * Helper to pick only certain keys.
   * Usage: pick(rawData, ["a","b"])
   */
  const pick = <T extends object, K extends keyof T>(
    obj: T,
    keys: K[]
  ): Pick<T, K> =>
    keys.reduce((acc, k) => {
      acc[k] = obj[k];
      return acc;
    }, {} as Pick<T, K>);

  const handleCardClick = (cardId: string) =>
    setExpandedCard(expandedCard === cardId ? null : cardId);

  return (
    <div className="space-y-8">
      {/* Header with right-aligned toggles */}
      <div className="flex items-center justify-between pt-2 pb-4 border-b border-border" style={{ minHeight: '64px' }}>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-foreground mb-0">
            {ticker.name}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-muted-foreground text-base font-medium">
              {ticker.symbol}
            </p>
            {marketCap && marketCapCurrency && (
              <p className="text-muted-foreground text-base font-medium">
                {(() => {
                  const num = Number(marketCap.replace(/,/g, ""));
                  let display = marketCap;
                  let label = marketCapCurrency;
                  if (!isNaN(num)) {
                    if (num >= 1e10) { display = (num / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 }); label = `Billion ${marketCapCurrency}`; }
                    else if (num >= 1e7) { display = (num / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 }); label = `Million ${marketCapCurrency}`; }
                    else if (num >= 1e4) { display = (num / 1e3).toLocaleString(undefined, { maximumFractionDigits: 2 }); label = `Thousand ${marketCapCurrency}`; }
                    else { display = num.toLocaleString(); label = marketCapCurrency; }
                  }
                  return `Market Cap: ${display} ${label}`;
                })()}
              </p>
            )}
          </div>
        </div>
        {/* Toggles for annual/quarterly and table/chart */}
        <div className="flex gap-4 items-center">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Data:</span>
            <button
              className={`px-3 py-1 rounded font-semibold border transition-colors duration-150 ${period === 'annual' ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm' : 'bg-background text-foreground border-border'}`}
              onClick={() => setPeriod('annual')}
              style={{ minWidth: 80 }}
            >
              Annual
            </button>
            <button
              className={`px-3 py-1 rounded font-semibold border transition-colors duration-150 ${period === 'quarterly' ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm' : 'bg-background text-foreground border-border'}`}
              onClick={() => setPeriod('quarterly')}
              style={{ minWidth: 80 }}
            >
              Quarterly
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">View:</span>
            <button
              className={`px-3 py-1 rounded font-semibold border transition-colors duration-150 ${view === 'table' ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm' : 'bg-background text-foreground border-border'}`}
              onClick={() => setView('table')}
              style={{ minWidth: 80 }}
            >
              Table
            </button>
            <button
              className={`px-3 py-1 rounded font-semibold border transition-colors duration-150 ${view === 'chart' ? 'bg-blue-100 text-blue-700 border-blue-300 shadow-sm' : 'bg-background text-foreground border-border'}`}
              onClick={() => setView('chart')}
              style={{ minWidth: 80 }}
            >
              Chart
            </button>
          </div>
        </div>
      </div>

      {/* Loading/Error States */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
          <span>Loading financial data...</span>
        </div>
      ) : error ? (
        <div className="text-center text-destructive py-8">
          <span>Error: {error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {financialCategories.map((category) => (
            <FinancialCard
              key={category.id}
              category={category}
              isExpanded={expandedCard === category.id}
              onClick={() => handleCardClick(category.id)}
              fullWidth={expandedCard === category.id}
              view={view}
            />
          ))}
        </div>
      )}
    </div>
  );
};