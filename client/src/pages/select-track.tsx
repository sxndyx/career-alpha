import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TRACK_LABELS, type Track } from "@shared/schema";
import { ArrowRight, Check } from "lucide-react";

const trackShort: Record<Track, string> = {
  swe: "SWE",
  finance: "IB/CF",
  asset_management: "AM",
};

const trackDescriptions: Record<Track, string> = {
  swe: "optimized for software engineering internships and technical roles. weights skill density and technical brand recognition heavily.",
  finance: "tailored for investment banking and corporate finance paths. prioritizes brand prestige and institutional consistency.",
  asset_management: "built for asset management and buy-side roles. values internship depth, brand, and recent activity.",
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
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="text-xs text-muted-foreground tracking-widest uppercase mb-3">step 2</div>
        <h1 className="text-lg font-medium mb-2" data-testid="text-track-title">select career track</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          each track uses different weights to compute your career alpha score.
        </p>
      </div>

      <div className="space-y-2">
        {(Object.keys(TRACK_LABELS) as Track[]).map((track) => {
          const isSelected = selected === track;
          return (
            <button
              key={track}
              onClick={() => setSelected(track)}
              className={`w-full text-left p-5 rounded border transition-colors ${
                isSelected
                  ? "border-foreground/40 bg-secondary/40"
                  : "border-border/60 hover:border-border"
              }`}
              data-testid={`button-track-${track}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono font-bold">{trackShort[track]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{trackDescriptions[track]}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <Button
          onClick={handleScore}
          disabled={!selected || scoreMutation.isPending}
          className="gap-2 text-xs tracking-wide"
          data-testid="button-compute-score"
        >
          {scoreMutation.isPending ? "computing..." : "compute career alpha"}
          {!scoreMutation.isPending && <ArrowRight className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}
