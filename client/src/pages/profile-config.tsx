import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Position, type Education, type ProfileOverrides, type CareerTrack } from "@shared/schema";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const SIGNAL_OPTIONS = [
  { value: "default", label: "auto-detect" },
  { value: "1", label: "high signal" },
  { value: "2", label: "medium signal" },
  { value: "3", label: "standard" },
  { value: "4", label: "low signal" },
];

export default function ProfileConfigPage() {
  const { toast } = useToast();

  const { data: positions, isLoading: posLoading } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
  });

  const { data: education, isLoading: eduLoading } = useQuery<Education[]>({
    queryKey: ["/api/education"],
  });

  const { data: overrides, isLoading: overridesLoading } = useQuery<ProfileOverrides>({
    queryKey: ["/api/profile-config"],
  });

  const { data: tracks } = useQuery<CareerTrack[]>({
    queryKey: ["/api/tracks"],
  });

  const [excludePositionIds, setExcludePositionIds] = useState<string[]>([]);
  const [internshipOverrideStr, setInternshipOverrideStr] = useState<string>("");
  const [companyTierOverrides, setCompanyTierOverrides] = useState<Record<string, number>>({});
  const [schoolTierOverrides, setSchoolTierOverrides] = useState<Record<string, number>>({});
  const [targetTrack, setTargetTrack] = useState<string>("none");

  useEffect(() => {
    if (overrides) {
      setExcludePositionIds(overrides.excludePositionIds ?? []);
      setInternshipOverrideStr(
        overrides.internshipOverride !== undefined
          ? String(overrides.internshipOverride)
          : ""
      );
      setCompanyTierOverrides(overrides.companyTierOverrides ?? {});
      setSchoolTierOverrides(overrides.schoolTierOverrides ?? {});
      setTargetTrack(overrides.targetTrack ?? "none");
    }
  }, [overrides]);

  const mutation = useMutation({
    mutationFn: (data: ProfileOverrides) =>
      apiRequest("PUT", "/api/profile-config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile-config"] });
      toast({ description: "profile adjustments saved" });
    },
    onError: () => {
      toast({ description: "failed to save adjustments", variant: "destructive" });
    },
  });

  function handleSave() {
    const internshipOverride =
      internshipOverrideStr !== "" && !isNaN(Number(internshipOverrideStr))
        ? Number(internshipOverrideStr)
        : undefined;

    mutation.mutate({
      excludePositionIds,
      ...(internshipOverride !== undefined && { internshipOverride }),
      companyTierOverrides,
      schoolTierOverrides,
      ...(targetTrack !== "none" && { targetTrack }),
    });
  }

  function toggleExcludePosition(posId: string) {
    setExcludePositionIds((prev) =>
      prev.includes(posId) ? prev.filter((id) => id !== posId) : [...prev, posId]
    );
  }

  function setCompanyTier(company: string, value: string) {
    if (value === "default") {
      setCompanyTierOverrides((prev) => {
        const next = { ...prev };
        delete next[company.toLowerCase()];
        return next;
      });
    } else {
      setCompanyTierOverrides((prev) => ({ ...prev, [company.toLowerCase()]: Number(value) }));
    }
  }

  function setSchoolTier(institution: string, value: string) {
    if (value === "default") {
      setSchoolTierOverrides((prev) => {
        const next = { ...prev };
        delete next[institution.toLowerCase()];
        return next;
      });
    } else {
      setSchoolTierOverrides((prev) => ({ ...prev, [institution.toLowerCase()]: Number(value) }));
    }
  }

  const isLoading = posLoading || eduLoading || overridesLoading;

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <span className="text-sm text-muted-foreground animate-pulse tracking-wide">loading...</span>
      </div>
    );
  }

  const hasPositions = positions && positions.length > 0;
  const hasEducation = education && education.length > 0;


  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <Link href="/settings">
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors" data-testid="link-back-settings">
          <ArrowLeft className="w-3 h-3" />
          back to settings
        </button>
      </Link>

      <div className="mb-10">
        <h1 className="text-sm font-mono tracking-widest text-foreground mb-1">profile adjustments</h1>
        <p className="text-xs text-muted-foreground tracking-wide">
          fine-tune what gets included in your score computation
        </p>
      </div>

      <div className="space-y-8">
        {tracks && tracks.length > 0 && (
          <section>
            <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">target track</h2>
            <div className="border border-border/60 rounded p-4">
              <p className="text-xs text-muted-foreground tracking-wide mb-3">
                your preferred career path. used to default the scoring track.
              </p>
              <Select value={targetTrack} onValueChange={setTargetTrack}>
                <SelectTrigger
                  className="h-8 text-xs w-64 border-border/60 bg-background focus:ring-0 font-mono"
                  data-testid="select-target-track"
                >
                  <SelectValue placeholder="select a track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">no preference</SelectItem>
                  {tracks.map((t) => (
                    <SelectItem key={t.slug} value={t.slug} className="text-xs">
                      {t.name.toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>
        )}

        {hasPositions && (
          <section>
            <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-2">positions</h2>
            <p className="text-xs text-muted-foreground tracking-wide mb-4">
              company score override — used only when imported data is ambiguous or needs correction.
            </p>
            <div className="border border-border/60 rounded divide-y divide-border/40">
              {positions!.map((pos) => {
                const isExcluded = excludePositionIds.includes(pos.id);
                const companyKey = (pos.company ?? "").toLowerCase();
                const companyTierValue = companyTierOverrides[companyKey]?.toString() ?? "default";

                return (
                  <div
                    key={pos.id}
                    className={`p-4 ${isExcluded ? "opacity-40" : ""}`}
                    data-testid={`position-row-${pos.id}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground tracking-wide truncate">{pos.title}</p>
                        <p className="text-xs text-muted-foreground tracking-wide truncate">{pos.company}</p>
                        <p className="text-xs text-muted-foreground/60 tracking-wide">
                          {pos.startDate ?? "?"} — {pos.endDate ?? "present"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-muted-foreground tracking-wide">include</span>
                        <Switch
                          checked={!isExcluded}
                          onCheckedChange={() => toggleExcludePosition(pos.id)}
                          data-testid={`toggle-include-${pos.id}`}
                        />
                      </div>
                    </div>

                    {!isExcluded && pos.company && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground tracking-wide">company score override</span>
                        <Select
                          value={companyTierValue}
                          onValueChange={(v) => setCompanyTier(pos.company!, v)}
                        >
                          <SelectTrigger
                            className="h-6 text-xs w-36 border-border/60 bg-background focus:ring-0"
                            data-testid={`select-company-tier-${pos.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SIGNAL_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">internship count override</h2>
          <div className="border border-border/60 rounded p-4">
            <p className="text-xs text-muted-foreground tracking-wide mb-3">
              override the detected internship count if the automatic detection is incorrect.
            </p>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                max="20"
                value={internshipOverrideStr}
                onChange={(e) => setInternshipOverrideStr(e.target.value)}
                placeholder="auto"
                className="font-mono text-sm h-8 w-24 bg-background border-border/60 focus-visible:ring-0 focus-visible:border-foreground/30"
                data-testid="input-internship-override"
              />
              <span className="text-xs text-muted-foreground tracking-wide">internships</span>
              {internshipOverrideStr !== "" && (
                <button
                  onClick={() => setInternshipOverrideStr("")}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 tracking-wide"
                  data-testid="button-clear-internship-override"
                >
                  reset to auto
                </button>
              )}
            </div>
          </div>
        </section>

        {hasEducation && (
          <section>
            <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-2">education</h2>
            <p className="text-xs text-muted-foreground tracking-wide mb-4">
              school score override — used only when imported data is ambiguous or needs correction.
            </p>
            <div className="border border-border/60 rounded divide-y divide-border/40">
              {education!.map((edu) => {
                const institutionKey = (edu.institution ?? "").toLowerCase();
                const tierValue = institutionKey
                  ? schoolTierOverrides[institutionKey]?.toString() ?? "default"
                  : "default";

                return (
                  <div key={`${edu.institution}_${edu.degree}`} className="p-4" data-testid={`education-row-${institutionKey}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground tracking-wide truncate">{edu.institution}</p>
                        <p className="text-xs text-muted-foreground tracking-wide truncate">
                          {edu.degree ?? ""} {edu.fieldOfStudy ? `· ${edu.fieldOfStudy}` : ""}
                        </p>
                      </div>
                      {edu.institution && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Select
                            value={tierValue}
                            onValueChange={(v) => setSchoolTier(edu.institution!, v)}
                          >
                            <SelectTrigger
                              className="h-6 text-xs w-36 border-border/60 bg-background focus:ring-0"
                              data-testid={`select-school-tier-${institutionKey}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SIGNAL_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="h-8 px-6 text-xs tracking-wide font-mono"
            data-testid="button-save-profile-config"
          >
            {mutation.isPending ? "saving..." : "save adjustments"}
          </Button>
        </div>
      </div>
    </div>
  );
}
