import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

interface SparklineChartProps {
  score: number;
  period: string;
  userId?: string;
  track?: string;
  height?: number;
}

const PERIOD_POINTS: Record<string, number> = {
  "1W": 7,
  "1M": 30,
  "3M": 13,
  "6M": 26,
  "1Y": 52,
  "ALL": 104,
};

const PERIOD_LABELS: Record<string, string> = {
  "1W": "day",
  "1M": "day",
  "3M": "week",
  "6M": "week",
  "1Y": "week",
  "ALL": "week",
};

export function generateSyntheticSeries(
  score: number,
  period: string,
  userId: string = "default",
  track: string = "swe"
): { index: number; value: number; label: string }[] {
  const seedStr = `${userId}-${track}-${period}`;
  const seed = hashString(seedStr);
  const rng = seededRandom(seed);

  const points = PERIOD_POINTS[period] || 30;
  const unit = PERIOD_LABELS[period] || "day";

  const volatility = 0.06;
  const startOffset = (rng() - 0.5) * score * 0.3;
  const startValue = Math.max(5, Math.min(95, score + startOffset));

  const data: { index: number; value: number; label: string }[] = [];
  let current = startValue;

  for (let i = 0; i < points; i++) {
    const noise = (rng() - 0.5) * 2 * volatility * score;
    const drift = ((score - current) / (points - i)) * 0.4;
    current = Math.max(2, Math.min(98, current + drift + noise));
    data.push({
      index: i,
      value: Math.round(current * 10) / 10,
      label: `${unit} ${i + 1}`,
    });
  }

  data[data.length - 1].value = score;

  return data;
}

export function SparklineChart({ score, period, userId, track, height = 200 }: SparklineChartProps) {
  const data = generateSyntheticSeries(score, period, userId, track);

  const minVal = Math.min(...data.map((d) => d.value));
  const maxVal = Math.max(...data.map((d) => d.value));
  const padding = (maxVal - minVal) * 0.15 || 5;

  const isPositive = data.length >= 2 && data[data.length - 1].value >= data[0].value;
  const strokeColor = isPositive ? "hsl(var(--ca-positive))" : "hsl(var(--ca-negative))";
  const fillColor = isPositive ? "hsl(var(--ca-positive))" : "hsl(var(--ca-negative))";

  return (
    <div className="animate-fade-slide" key={period} data-testid="sparkline-chart">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradient-${period}`} x1="0" y1="0" x2="0" y2="1">
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
            fill={`url(#gradient-${period})`}
            dot={false}
            activeDot={{ r: 3, stroke: strokeColor, strokeWidth: 1.5, fill: "hsl(var(--background))" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
