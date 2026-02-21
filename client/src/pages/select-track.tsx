import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TRACK_LABELS, type Track } from "@shared/schema";
import { Code2, Landmark, PieChart, ArrowRight, Check } from "lucide-react";

const trackIcons: Record<Track, typeof Code2> = {
  swe: Code2,
  finance: Landmark,
  asset_management: PieChart,
};

const trackDescriptions: Record<Track, string> = {
  swe: "Optimized for software engineering internships and technical roles. Weights skill density and technical brand recognition heavily.",
  finance: "Tailored for investment banking and corporate finance paths. Prioritizes brand prestige and institutional consistency.",
  asset_management: "Built for asset management and buy-side roles. Values internship depth, brand, and recent activity.",
};

const trackColors: Record<Track, string> = {
  swe: "text-primary",
  finance: "text-chart-2",
  asset_management: "text-chart-4",
};

const trackBgColors: Record<Track, string> = {
  swe: "bg-primary/10",
  finance: "bg-chart-2/10",
  asset_management: "bg-chart-4/10",
};

export default function SelectTrackPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Track | null>(null);

  const scoreMutation = useMutation({
    mutationFn: async (track: Track) => {
      const res = await apiRequest("POST", "/api/score", { track });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/score"] });
      queryClient.invalidateQueries({ queryKey: ["/api/features"] });
      queryClient.invalidateQueries({ predicate: (query) => (query.queryKey[0] as string)?.startsWith("/api/leaderboard") });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Scoring failed", description: error.message, variant: "destructive" });
    },
  });

  const handleScore = () => {
    if (selected) scoreMutation.mutate(selected);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="font-serif text-3xl font-bold mb-2" data-testid="text-track-title">Select Career Track</h1>
          <p className="text-muted-foreground">
            Choose the track that matches your career goals. Each track uses different weights to compute your Career Alpha Score.
          </p>
        </div>

        <div className="space-y-3">
          {(Object.keys(TRACK_LABELS) as Track[]).map((track) => {
            const Icon = trackIcons[track];
            const isSelected = selected === track;
            return (
              <button
                key={track}
                onClick={() => setSelected(track)}
                className={`w-full text-left p-6 rounded-md border transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-card-border bg-card"
                }`}
                data-testid={`button-track-${track}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-md ${trackBgColors[track]} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${trackColors[track]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{TRACK_LABELS[track]}</h3>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{trackDescriptions[track]}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <Button
            onClick={handleScore}
            disabled={!selected || scoreMutation.isPending}
            className="gap-2"
            data-testid="button-compute-score"
          >
            {scoreMutation.isPending ? "Computing Score..." : "Compute Career Alpha"}
            {!scoreMutation.isPending && <ArrowRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
