import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl } from "@/components/segmented-control";
import { type CareerTrack } from "@shared/schema";

interface LeaderboardEntry {
  rank: number;
  totalScore: number;
  percentile: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const [selectedTrack, setSelectedTrack] = useState<string>("swe");

  const { data: tracks } = useQuery<CareerTrack[]>({
    queryKey: ["/api/tracks"],
  });

  const trackSegments = (tracks || []).map((t) => ({
    value: t.slug,
    label: t.slug === "swe" ? "SWE" : t.slug === "finance" ? "IB/CF" : t.slug === "asset_management" ? "AM" : t.name,
  }));

  const selectedTrackName = tracks?.find((t) => t.slug === selectedTrack)?.name || selectedTrack;

  const { data: entries, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard", selectedTrack],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/${selectedTrack}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });

  const getPercentileBand = (percentile: number) => {
    if (percentile >= 90) return "elite";
    if (percentile >= 75) return "strong";
    if (percentile >= 50) return "average";
    return "developing";
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-lg font-medium mb-1" data-testid="text-leaderboard-title">leaderboard</h1>
          <p className="text-xs text-muted-foreground">anonymous rankings by track</p>
        </div>
        {trackSegments.length > 0 && (
          <SegmentedControl
            options={trackSegments}
            value={selectedTrack}
            onChange={setSelectedTrack}
            size="sm"
          />
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-secondary/40 rounded animate-pulse" />
          ))}
        </div>
      ) : !entries || entries.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-xs text-muted-foreground tracking-widest uppercase mb-2">no rankings</div>
          <p className="text-xs text-muted-foreground" data-testid="text-no-entries">
            be the first to compute a score for {selectedTrackName.toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground">
            <span className="w-8">#</span>
            <span className="flex-1">user</span>
            <span className="w-16 text-right">score</span>
            <span className="w-20 text-right">band</span>
          </div>
          {entries.map((entry) => {
            const band = getPercentileBand(entry.percentile);
            return (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 px-4 py-3 rounded transition-colors ${
                  entry.isCurrentUser
                    ? "bg-secondary/50"
                    : "hover:bg-secondary/20"
                }`}
                data-testid={`row-leaderboard-${entry.rank}`}
              >
                <span className="w-8 text-xs font-mono text-muted-foreground">
                  {entry.rank <= 3 ? `#${entry.rank}` : entry.rank}
                </span>
                <span className="flex-1 text-xs">
                  {entry.isCurrentUser ? (
                    <span className="font-medium">you</span>
                  ) : (
                    <span className="text-muted-foreground">user #{entry.rank}</span>
                  )}
                </span>
                <span className="w-16 text-right text-xs font-mono" data-testid={`text-score-${entry.rank}`}>
                  {entry.totalScore.toFixed(1)}
                </span>
                <span className="w-20 text-right">
                  <span className="text-xs text-muted-foreground">{band}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-border/60">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">bands:</span>{" "}
          elite (90th+) · strong (75th+) · average (50th+) · developing (&lt;50th)
        </div>
      </div>
    </div>
  );
}
