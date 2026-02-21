import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Users } from "lucide-react";
import { TRACK_LABELS, type Track } from "@shared/schema";

interface LeaderboardEntry {
  rank: number;
  totalScore: number;
  percentile: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const [selectedTrack, setSelectedTrack] = useState<Track>("swe");

  const { data: entries, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard", selectedTrack],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/${selectedTrack}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-chart-5" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-chart-5/60" />;
    return null;
  };

  const getPercentileBand = (percentile: number) => {
    if (percentile >= 90) return { label: "Elite", variant: "default" as const };
    if (percentile >= 75) return { label: "Strong", variant: "secondary" as const };
    if (percentile >= 50) return { label: "Average", variant: "secondary" as const };
    return { label: "Developing", variant: "outline" as const };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-start justify-between gap-4 mb-10 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2" data-testid="text-leaderboard-title">Leaderboard</h1>
            <p className="text-muted-foreground">Anonymous rankings by career track</p>
          </div>
          <Select value={selectedTrack} onValueChange={(v) => setSelectedTrack(v as Track)}>
            <SelectTrigger className="w-[220px]" data-testid="select-track-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TRACK_LABELS) as Track[]).map((track) => (
                <SelectItem key={track} value={track} data-testid={`option-track-${track}`}>
                  {TRACK_LABELS[track]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : !entries || entries.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <h2 className="font-semibold mb-1" data-testid="text-no-entries">No Rankings Yet</h2>
              <p className="text-sm text-muted-foreground">
                Be the first to compute a score for {TRACK_LABELS[selectedTrack]}.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const band = getPercentileBand(entry.percentile);
              return (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 p-4 rounded-md border ${
                    entry.isCurrentUser
                      ? "border-primary bg-primary/5"
                      : "border-card-border bg-card"
                  }`}
                  data-testid={`row-leaderboard-${entry.rank}`}
                >
                  <div className="w-10 text-center shrink-0">
                    {getRankIcon(entry.rank) || (
                      <span className="text-sm font-mono text-muted-foreground">#{entry.rank}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {entry.isCurrentUser ? "You" : `User #${entry.rank}`}
                      </span>
                      {entry.isCurrentUser && <Badge variant="secondary">You</Badge>}
                      <Badge variant={band.variant}>{band.label}</Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold" data-testid={`text-score-${entry.rank}`}>
                      {entry.totalScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      P{Math.round(entry.percentile)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 p-4 rounded-md bg-card border border-card-border">
          <div className="flex items-center gap-3">
            <Trophy className="w-4 h-4 text-chart-5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Percentile Bands:</span>{" "}
              Elite (90th+) / Strong (75th+) / Average (50th+) / Developing (below 50th)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
