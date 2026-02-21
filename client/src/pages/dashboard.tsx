import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Trophy, Target, Lightbulb, ArrowRight, BarChart3 } from "lucide-react";
import { TRACK_LABELS, type Score, type ComputedFeatures, type Track } from "@shared/schema";
import { Link } from "wouter";

const FACTOR_LABELS: Record<string, string> = {
  internship_count: "Internships",
  brand_score: "Brand Score",
  skill_density: "Skill Density",
  education_tier_score: "Education",
  seniority_progression_score: "Seniority",
  network_size: "Network",
  recency_score: "Recency",
  consistency_score: "Consistency",
};

const CHART_COLORS = [
  "hsl(217, 91%, 45%)",
  "hsl(173, 58%, 40%)",
  "hsl(197, 37%, 40%)",
  "hsl(280, 65%, 50%)",
  "hsl(43, 74%, 50%)",
  "hsl(0, 84%, 45%)",
  "hsl(150, 50%, 40%)",
  "hsl(30, 70%, 50%)",
];

function ScoreGauge({ score, percentile }: { score: number; percentile: number }) {
  const displayScore = Math.round(score * 10) / 10;
  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative w-40 h-40 mb-4">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 326.73} 326.73`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-mono font-bold" data-testid="text-total-score">{displayScore}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm text-muted-foreground mb-1">Percentile Ranking</div>
        <div className="text-2xl font-mono font-bold" data-testid="text-percentile">
          Top {Math.max(1, Math.round(100 - percentile))}%
        </div>
      </div>
    </div>
  );
}

function FactorChart({ breakdown }: { breakdown: Record<string, number> }) {
  const data = Object.entries(breakdown).map(([key, value]) => ({
    name: FACTOR_LABELS[key] || key,
    value: Math.round(value * 100) / 100,
    fullKey: key,
  }));

  return (
    <ResponsiveContainer width="100%" height={data.length * 44 + 20}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--card-border))",
            borderRadius: "6px",
            fontSize: "13px",
          }}
          formatter={(value: number) => [value.toFixed(2), "Score Contribution"]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

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

  const isLoading = scoreLoading || featuresLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96 mb-10" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-72" />
            <Skeleton className="h-72 md:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!scoreData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2" data-testid="text-no-score">No Score Yet</h2>
          <p className="text-muted-foreground mb-6">
            Upload your LinkedIn data and select a career track to see your Career Alpha Score.
          </p>
          <Link href="/upload">
            <Button className="gap-2" data-testid="button-go-upload">
              Upload Data
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const track = scoreData.track as Track;
  const breakdown = (scoreData.factorBreakdown || {}) as Record<string, number>;
  const recommendations = (scoreData.recommendations || []) as string[];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-start justify-between gap-4 mb-10 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2" data-testid="text-dashboard-title">
              {user?.firstName ? `${user.firstName}'s Dashboard` : "Your Dashboard"}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" data-testid="badge-track">{TRACK_LABELS[track]}</Badge>
              <span className="text-sm text-muted-foreground">
                Scored {scoreData.computedAt ? new Date(scoreData.computedAt).toLocaleDateString() : "today"}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/select-track">
              <Button variant="secondary" size="sm" data-testid="button-change-track">Change Track</Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="secondary" size="sm" className="gap-1.5" data-testid="button-view-leaderboard">
                <Trophy className="w-3.5 h-3.5" />
                Leaderboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6" data-testid="card-score-gauge">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Career Alpha Score</h2>
            </div>
            <ScoreGauge score={scoreData.totalScore} percentile={scoreData.percentile || 0} />
          </Card>

          <Card className="p-6 md:col-span-2" data-testid="card-factor-breakdown">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-chart-2" />
              <h2 className="font-semibold text-sm">Factor Contribution Breakdown</h2>
            </div>
            <FactorChart breakdown={breakdown} />
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="p-6" data-testid="card-recommendations">
            <div className="flex items-center gap-2 mb-5">
              <Lightbulb className="w-4 h-4 text-chart-5" />
              <h2 className="font-semibold text-sm">Top Recommendations</h2>
            </div>
            {recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.slice(0, 3).map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-background border border-border" data-testid={`text-recommendation-${i}`}>
                    <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-sm leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Great job! Your profile is well-optimized for this track.</p>
            )}
          </Card>

          <Card className="p-6" data-testid="card-raw-features">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4 text-chart-3" />
              <h2 className="font-semibold text-sm">Raw Feature Values</h2>
            </div>
            {features ? (
              <div className="space-y-3">
                {[
                  { label: "Internship Count", value: features.internshipCount, max: 10 },
                  { label: "Total Roles", value: features.totalRoles, max: 15 },
                  { label: "Brand Score", value: features.brandScore, max: 100 },
                  { label: "Education Tier", value: features.educationTierScore, max: 100 },
                  { label: "Skill Density", value: features.skillDensity, max: 20 },
                  { label: "Network Size", value: features.networkSize, max: 500 },
                  { label: "Recency Score", value: features.recencyScore, max: 100 },
                  { label: "Consistency", value: features.consistencyScore, max: 100 },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-mono text-xs">{typeof item.value === "number" ? item.value.toFixed(1) : "0"}</span>
                    </div>
                    <Progress value={Math.min(100, ((item.value || 0) / item.max) * 100)} className="h-1" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Feature data not available.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
