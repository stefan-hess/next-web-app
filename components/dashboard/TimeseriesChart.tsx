import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from 'components/ui/card';

interface DataPoint {
  date: string;
  value: number;
  volume?: number;
  change?: number;
  changePercent?: number;
}

interface TimeseriesChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DataPoint }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length && payload[0]) {
    const data = payload[0].payload as DataPoint | undefined;
    if (!data) return null;
    const isPositive = typeof data.change === 'number' ? data.change >= 0 : true;
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-hover">
        <div className="text-sm font-medium text-foreground mb-2">{label}</div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Value:</span>
            <span className="font-medium text-foreground">
              ${data.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {typeof data.change === 'number' && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Change:</span>
              <span className={`font-medium ${isPositive ? 'text-chart-positive' : 'text-chart-negative'}`}>
                {isPositive ? '+' : ''}${data.change.toFixed(2)} ({isPositive ? '+' : ''}{data.changePercent?.toFixed(2)}%)
              </span>
            </div>
          )}
          {typeof data.volume === 'number' && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Volume:</span>
              <span className="font-medium text-foreground">
                {data.volume.toLocaleString('en-US')}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const TimeseriesChart = ({ data, title, subtitle }: TimeseriesChartProps) => {
  const [_hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  
  const latestValue = data[data.length - 1]?.value || 0;
  const latestChange = data[data.length - 1]?.change || 0;
  const latestChangePercent = data[data.length - 1]?.changePercent || 0;
  const isPositive = latestChange >= 0;

  return (
    <Card className="p-6 shadow-card hover:shadow-hover transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            ${latestValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className={`text-sm font-medium ${isPositive ? 'text-chart-positive' : 'text-chart-negative'}`}>
            {isPositive ? '+' : ''}${latestChange.toFixed(2)} ({isPositive ? '+' : ''}{latestChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            onMouseMove={(e) => {
              const payload = (e as { tooltipPayload?: Array<{ payload: DataPoint }>; activePayload?: Array<{ payload: DataPoint }> }).tooltipPayload || (e as { tooltipPayload?: Array<{ payload: DataPoint }>; activePayload?: Array<{ payload: DataPoint }> }).activePayload;
              if (payload && payload[0]) {
                setHoveredPoint(payload[0].payload);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--chart-primary))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.5}
            />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--chart-primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: "hsl(var(--chart-primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2
              }}
              fill="url(#chartGradient)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};