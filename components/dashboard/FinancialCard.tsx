// Helper to auto-scale values and return scale factor and label
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
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { cn } from "app/lib/utils";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";


export interface FinancialCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  data: Array<Record<string, string>>;
}

export interface FinancialCardProps {
  category: FinancialCategory;
  isExpanded: boolean;
  onClick: () => void;
  fullWidth?: boolean;
  view?: 'table' | 'chart';
}

export const FinancialCard: React.FC<FinancialCardProps> = ({ category, isExpanded, onClick, fullWidth, view = 'table' }) => {
  const Icon = category.icon;

  // Get currency from first period
  const currency = category.data[0]?.reportedCurrency || "";

  const getColorClasses = (color: string) => {
    switch (color) {
      case "primary":
        return "text-primary bg-primary/10";
      case "success": 
        return "text-success bg-success-light";
      case "warning":
        return "text-warning bg-warning-light";
      case "secondary":
        return "text-secondary-foreground bg-secondary";
      default:
        return "text-primary bg-primary/10";
    }
  };

  const formatLabel = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Collect all keys from all periods
  const allKeys: string[] = Array.from(
    new Set(category.data.flatMap((period: Record<string, string>) => Object.keys(period)))
  ).filter(key => key !== "reportedCurrency" && key !== "fiscalDateEnding");

  // Get period labels (dates), slice to 5 if minimized, 10 if expanded
  const maxPeriods = isExpanded ? 10 : 3;
  const periodLabels: string[] = category.data.map((period: Record<string, string>) => period.fiscalDateEnding || "").slice(0, maxPeriods);

  // For each metric, compute scale and label (use only displayed periods)
  const metricScales: Record<string, { scale: number; label: string }> = {};
  allKeys.forEach(key => {
    const values = category.data.slice(0, maxPeriods).map(period => period[key] || "");
    metricScales[key] = autoScale(values, currency);
  });

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-hover border",
        "bg-gradient-card shadow-card hover:-translate-y-1",
        fullWidth && "md:col-span-2"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", getColorClasses(category.color))}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-lg font-semibold">{category.title}</span>
          </div>
          <div className="transition-transform duration-200 ml-2">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CardTitle>
        {/* Scale label as sub-header */}
        <div className="text-xs text-muted-foreground mt-1 pl-1">
          {/* Show the most common scale label among metrics */}
          {(() => {
            const labels = Object.values(metricScales).map(s => s.label);
            const labelCounts = labels.reduce((acc, l) => { acc[l] = (acc[l] || 0) + 1; return acc; }, {} as Record<string, number>);
            return Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || currency;
          })()}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={cn(
          "transition-all duration-300 overflow-auto",
          isExpanded ? "max-h-96 opacity-100" : "max-h-20 opacity-60"
        )}>
          {view === 'table' ? (
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left font-medium text-muted-foreground">Metric</th>
                  {periodLabels.map((label, idx) => (
                    <th key={label + idx} className="text-right font-medium text-muted-foreground">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allKeys.map((key) => (
                  <tr key={key}>
                    <td className="py-2 border-b border-border/50 text-muted-foreground font-medium">
                      {formatLabel(key)}
                    </td>
                    {category.data.slice(0, maxPeriods).map((period, idx) => {
                            const raw = period[key] || "";
                            const scale = metricScales[key]?.scale ?? 1;
                            let num = Number(raw.replace(/,/g, ""));
                            let display = raw;
                            if (!isNaN(num) && scale !== 1 && raw !== "") {
                              display = (num / scale).toLocaleString(undefined, { maximumFractionDigits: 2 });
                            }
                            return (
                              <td key={idx} className="py-2 border-b border-border/50 text-right font-semibold text-foreground">
                                {display}
                              </td>
                            );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Chart view: show first metric as timeseries
            (() => {
              const metricKey = allKeys[0] ?? '';
              if (!metricKey) return <div className="text-muted-foreground text-sm">No data for chart</div>;
              const chartData = category.data.slice(0, maxPeriods).map((period: Record<string, string>) => {
                const scale = metricScales[metricKey]?.scale ?? 1;
                let num = Number((period[metricKey] || "0").replace(/,/g, ""));
                if (!isNaN(num) && scale !== 1) num = num / scale;
                return {
                  date: period.fiscalDateEnding || '',
                  value: isNaN(num) ? null : num,
                };
              });
              return (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => value?.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
                    <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              );
            })()
          )}
        </div>
      </CardContent>
    </Card>
  );
};