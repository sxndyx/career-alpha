import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ScoreHistory } from "@shared/schema";

export interface ScorePoint {
  date: string;
  value: number;
  label: string;
}

const PERIOD_MS: Record<string, number> = {
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  "3M": 90 * 24 * 60 * 60 * 1000,
  "6M": 180 * 24 * 60 * 60 * 1000,
  "1Y": 365 * 24 * 60 * 60 * 1000,
  "ALL": Infinity,
};

export function filterHistoryByPeriod(history: ScoreHistory[], period: string): ScorePoint[] {
  const cutoff = period === "ALL" ? 0 : Date.now() - (PERIOD_MS[period] ?? PERIOD_MS["ALL"]);
  return history
    .filter((h) => h.createdAt && new Date(h.createdAt).getTime() >= cutoff)
    .map((h) => ({
      date: h.createdAt ? new Date(h.createdAt).toISOString() : "",
      value: h.score,
      label: h.createdAt
        ? new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "",
    }));
}

interface SparklineChartProps {
  data: ScorePoint[];
  height?: number;
}

export function SparklineChart({ data, height = 200 }: SparklineChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
        data-testid="sparkline-empty"
      >
        <div className="text-center">
          <div className="text-xs tracking-widest uppercase mb-1">no history</div>
          <p className="text-xs">score history will appear here after each computation</p>
        </div>
      </div>
    );
  }

  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));
  const padding = (maxVal - minVal) * 0.15 || 5;

  const isPositive = data.length >= 2 && data[data.length - 1].value >= data[0].value;
  const strokeColor = isPositive ? "hsl(var(--ca-positive))" : "hsl(var(--ca-negative))";
  const fillColor = isPositive ? "hsl(var(--ca-positive))" : "hsl(var(--ca-negative))";

  return (
    <div className="animate-fade-slide" data-testid="sparkline-chart">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          <YAxis domain={[minVal - padding, maxVal + padding]} hide />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "4px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              padding: "6px 10px",
            }}
            formatter={(value: number) => [value.toFixed(1), "Score"]}
            labelFormatter={(label) => label}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill="url(#sparkline-gradient)"
            dot={false}
            activeDot={{ r: 3, stroke: strokeColor, strokeWidth: 1.5, fill: "hsl(var(--background))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
