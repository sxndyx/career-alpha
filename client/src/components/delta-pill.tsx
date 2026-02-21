import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DeltaPillProps {
  value: number;
  suffix?: string;
}

export function DeltaPill({ value, suffix = "pts" }: DeltaPillProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const colorClass = isPositive
    ? "text-[hsl(var(--ca-positive))] bg-[hsl(var(--ca-positive)/0.1)]"
    : isNegative
    ? "text-[hsl(var(--ca-negative))] bg-[hsl(var(--ca-negative)/0.1)]"
    : "text-muted-foreground bg-secondary/60";

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium tracking-wide ${colorClass}`}
      data-testid="delta-pill"
    >
      <Icon className="w-3 h-3" />
      <span>
        {isPositive && "+"}
        {value.toFixed(1)} {suffix}
      </span>
    </span>
  );
}
