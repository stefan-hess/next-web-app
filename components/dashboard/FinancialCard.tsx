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
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "app/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
// Removed unused useState import


export interface FinancialCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  data: Array<Record<string, string>>;
  // Optional mapping from data keys to display labels
  labels?: Record<string, string>;
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

  // Default label formatter: handle camelCase and snake_case
  const defaultFormatLabel = (key: string): string => {
    // Replace underscores with spaces first (snake_case), then split camelCase
    const withSpaces = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1');
    // Title case
    return withSpaces
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .trim();
  };

  const resolveLabel = (key: string): string => {
    if (category.labels && category.labels[key]) return category.labels[key];
    return defaultFormatLabel(key);
  };

  // Collect all keys from all periods
  const allKeys: string[] = Array.from(
    new Set(category.data.flatMap((period: Record<string, string>) => Object.keys(period)))
  ).filter(key => key !== "reportedCurrency" && key !== "fiscalDateEnding" && key !== "date");

  // Get period labels (dates), slice to 5 if minimized, 10 if expanded, and reverse for oldest left
  const maxPeriods = isExpanded ? 10 : 3;
  // Use 'date' for shares outstanding, 'fiscalDateEnding' for others
  const periodLabels: string[] = (category.id === "shares-outstanding"
    ? category.data.map((period: Record<string, string>) => period.date || "")
    : category.data.map((period: Record<string, string>) => period.fiscalDateEnding || ""))
    .slice(0, maxPeriods)
    .reverse();

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
                      {resolveLabel(key)}
                    </td>
                    {[...category.data.slice(0, maxPeriods)].reverse().map((period, idx) => {
                      const raw = period[key] || "";
                      const scale = metricScales[key]?.scale ?? 1;
                      const num = Number(raw.replace(/,/g, ""));
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
              if (allKeys.length === 0) return <div className="text-muted-foreground text-sm">No data for chart</div>;
              // Show only 3 periods and reduce chart height if minimized
              const chartPeriods = isExpanded ? maxPeriods : 3;
              const chartHeight = isExpanded ? 220 : 120;
              const chartData = category.data.slice(0, chartPeriods).map((period: Record<string, string>) => {
                const obj: Record<string, number | null | string> =
                  category.id === "shares-outstanding"
                    ? { date: period.date || '' }
                    : { date: period.fiscalDateEnding || '' };
                allKeys.forEach((key) => {
                  const scale = metricScales[key]?.scale ?? 1;
                  let num = Number((period[key] || "0").replace(/,/g, ""));
                  if (!isNaN(num) && scale !== 1) num = num / scale;
                  obj[key] = isNaN(num) ? null : num;
                });
                return obj;
              });
              // Reverse so oldest is on the left
              const reversedChartData = [...chartData].reverse();
              // Color palette for lines
              const colors = ["#2563eb", "#059669", "#eab308", "#db2777", "#f97316", "#10b981", "#6366f1", "#f43f5e", "#a21caf", "#64748b"];
              return (
                <div>
                  <ResponsiveContainer width="100%" height={chartHeight}>
                    <LineChart data={reversedChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number, name: string) => [`${value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, resolveLabel(name)]} />
                      {allKeys.map((key, idx) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={colors[idx % colors.length]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name={resolveLabel(key)}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  {/* Legend below chart */}
                  <div className="flex flex-wrap gap-4 mt-3 justify-center">
                    {allKeys.map((key, idx) => (
                      <div key={key} className="flex items-center gap-2">
                        <span style={{ background: colors[idx % colors.length], width: 16, height: 4, display: 'inline-block', borderRadius: 2 }}></span>
                        <span className="text-xs text-muted-foreground">{resolveLabel(key)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </CardContent>
    </Card>
  );
};