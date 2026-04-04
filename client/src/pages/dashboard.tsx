import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { SegmentedControl } from "@/components/segmented-control";
import { DeltaPill } from "@/components/delta-pill";
import { SparklineChart, generateSyntheticSeries } from "@/components/sparkline-chart";
import { ArrowRight } from "lucide-react";
import { type Score, type ComputedFeatures, type CareerTrack } from "@shared/schema";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const FACTOR_LABELS: Record<string, string> = {
  internship_count: "internships",
  brand_score: "brand",
  skill_density: "skills",
  education_tier_score: "education",
  seniority_progression_score: "seniority",
  network_size: "network",
  recency_score: "recency",
  consistency_score: "consistency",
};

const PERIODS = [
  { value: "1W", label: "1W" },
  { value: "1M", label: "1M" },
  { value: "3M", label: "3M" },
  { value: "6M", label: "6M" },
  { value: "1Y", label: "1Y" },
  { value: "ALL", label: "ALL" },
] as const;

type Period = typeof PERIODS[number]["value"];

function computeDelta(score: number, period: string, userId: string, track: string): number {
  const series = generateSyntheticSeries(score, period, userId, track);
  if (series.length < 2) return 0;
  return Math.round((series[series.length - 1].value - series[0].value) * 10) / 10;
}

function AnimatedScore({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const end = value;
    const duration = 400;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      setDisplay(Math.round(current * 10) / 10);
      if (progress < 1) requestAnimationFrame(tick);
      else ref.current = end;
    }

    requestAnimationFrame(tick);
  }, [value]);

  return <span>{display.toFixed(1)}</span>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("3M");

  const { data: scoreData, isLoading: scoreLoading } = useQuery<Score | null>({
    queryKey: ["/api/score"],
    queryFn: async () => {
      const res = await fetch("/api/score", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch score");
      return res.json();
    },
  });

  const { data: features, isLoading: featuresLoading } = useQuery<ComputedFeatures | null>({
    queryKey: ["/api/features"],
    queryFn: async () => {
      const res = await fetch("/api/features", { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch features");
      return res.json();
    },
  });

  const { data: tracks } = useQuery<CareerTrack[]>({
    queryKey: ["/api/tracks"],
  });

  const isLoading = scoreLoading || featuresLoading;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="space-y-6">
          <div className="h-4 w-32 bg-secondary/60 rounded animate-pulse" />
          <div className="h-16 w-48 bg-secondary/60 rounded animate-pulse" />
          <div className="h-48 bg-secondary/60 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-32">
        <div className="text-center">
          <div className="text-muted-foreground text-xs tracking-widest uppercase mb-4">no data</div>
          <h2 className="text-lg font-medium mb-2" data-testid="text-no-score">upload your linkedin data to begin</h2>
          <p className="text-sm text-muted-foreground mb-8">
            your career alpha score will appear here after analysis
          </p>
          <Link href="/upload">
            <Button variant="secondary" className="gap-2 text-xs tracking-wide" data-testid="button-go-upload">
              upload data
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const track = scoreData.track;
  const trackName = tracks?.find((t) => t.slug === track)?.name || track;
  const breakdown = (scoreData.factorBreakdown || {}) as Record<string, number>;
  const recommendations = (scoreData.recommendations || []) as string[];
  const userId = user?.id || "default";
  const delta = computeDelta(scoreData.totalScore, period, userId, track);

  const maxBreakdownValue = Math.max(...Object.values(breakdown), 1);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tracking-widest uppercase">
            {trackName}
          </span>
          <Link href="/select-track">
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2" data-testid="button-change-track">
              change
            </button>
          </Link>
        </div>
        <Link href="/leaderboard">
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide" data-testid="button-view-leaderboard">
            leaderboard →
          </button>
        </Link>
      </div>

      <div className="mb-10">
        <div className="flex items-end gap-4 mb-2 flex-wrap">
          <div className="text-6xl font-mono font-bold tracking-tight animate-count-up" data-testid="text-total-score" key={period}>
            <AnimatedScore value={scoreData.totalScore} />
          </div>
          <div className="flex flex-col gap-1 pb-2">
            <DeltaPill value={delta} />
            {scoreData.percentile != null && (
              <span className="text-xs text-muted-foreground" data-testid="text-percentile">
                top {Math.max(1, Math.round(100 - scoreData.percentile))}%
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground tracking-wide">career alpha score</div>
      </div>

      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <SegmentedControl
          options={[...PERIODS]}
          value={period}
          onChange={(v) => setPeriod(v as Period)}
          size="sm"
        />
        <span className="text-xs text-muted-foreground">
          scored {scoreData.computedAt ? new Date(scoreData.computedAt).toLocaleDateString() : "today"}
        </span>
      </div>

      <div className="mb-10 rounded-md border border-border/60 bg-card/50 p-4">
        <SparklineChart
          score={scoreData.totalScore}
          period={period}
          userId={userId}
          track={track}
          height={180}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="text-xs text-muted-foreground tracking-widest uppercase mb-4">factor breakdown</div>
          <div className="space-y-3" data-testid="card-factor-breakdown">
            {Object.entries(breakdown).map(([key, value]) => {
              const label = FACTOR_LABELS[key] || key;
              const pct = (value / maxBreakdownValue) * 100;
              return (
                <div key={key} className="group">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-mono">{value.toFixed(2)}</span>
                  </div>
                  <div className="h-1 bg-secondary/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground/30 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground tracking-widest uppercase mb-4">recommendations</div>
          {recommendations.length > 0 ? (
            <div className="space-y-3" data-testid="card-recommendations">
              {recommendations.slice(0, 4).map((rec, i) => (
                <div key={i} className="flex items-start gap-3" data-testid={`text-recommendation-${i}`}>
                  <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0 w-4">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-xs leading-relaxed text-muted-foreground">{rec}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">profile well-optimized for this track.</p>
          )}

          {features && (
            <>
              <div className="text-xs text-muted-foreground tracking-widest uppercase mb-4 mt-8">raw features</div>
              <div className="space-y-2" data-testid="card-raw-features">
                {[
                  { label: "internships", value: features.internshipCount },
                  { label: "total roles", value: features.totalRoles },
                  { label: "brand", value: features.brandScore },
                  { label: "education", value: features.educationTierScore },
                  { label: "skills", value: features.skillDensity },
                  { label: "network", value: features.networkSize },
                  { label: "recency", value: features.recencyScore },
                  { label: "consistency", value: features.consistencyScore },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-xs font-mono">{typeof item.value === "number" ? item.value.toFixed(1) : "0"}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
