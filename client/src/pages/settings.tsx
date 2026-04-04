import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

interface UserSettings {
  displayName: string | null;
  showOnLeaderboard: boolean;
  dailyUpdatesEnabled: boolean;
  email: string | null;
}

export default function SettingsPage() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
  });

  const [displayName, setDisplayName] = useState("");
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(false);
  const [dailyUpdatesEnabled, setDailyUpdatesEnabled] = useState(false);

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName ?? "");
      setShowOnLeaderboard(settings.showOnLeaderboard);
      setDailyUpdatesEnabled(settings.dailyUpdatesEnabled);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (data: Partial<UserSettings>) =>
      apiRequest("PUT", "/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ description: "settings saved" });
    },
    onError: () => {
      toast({ description: "failed to save settings", variant: "destructive" });
    },
  });

  function handleSave() {
    mutation.mutate({
      displayName: displayName.trim() || null,
      showOnLeaderboard,
      dailyUpdatesEnabled,
    });
  }

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center">
        <span className="text-sm text-muted-foreground animate-pulse tracking-wide">loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-sm font-mono tracking-widest text-foreground mb-1">settings</h1>
        <p className="text-xs text-muted-foreground tracking-wide">manage your profile and notification preferences</p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">identity</h2>
          <div className="space-y-4 border border-border/60 rounded p-4">
            <div>
              <label className="text-xs tracking-wide text-muted-foreground mb-1.5 block">display name</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="your name"
                className="font-mono text-sm h-8 bg-background border-border/60 focus-visible:ring-0 focus-visible:border-foreground/30"
                maxLength={64}
                data-testid="input-display-name"
              />
              <p className="text-xs text-muted-foreground mt-1.5 tracking-wide">
                shown on the leaderboard if opted in
              </p>
            </div>

            <div>
              <label className="text-xs tracking-wide text-muted-foreground mb-1 block">account email</label>
              <p className="text-sm font-mono text-foreground tracking-wide">{settings?.email ?? "—"}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">leaderboard</h2>
          <div className="border border-border/60 rounded p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground tracking-wide">show on leaderboard</p>
                <p className="text-xs text-muted-foreground mt-0.5 tracking-wide">display your name publicly in the rankings</p>
              </div>
              <Switch
                checked={showOnLeaderboard}
                onCheckedChange={setShowOnLeaderboard}
                data-testid="toggle-show-on-leaderboard"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">notifications</h2>
          <div className="border border-border/60 rounded p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground tracking-wide">daily score updates</p>
                <p className="text-xs text-muted-foreground mt-0.5 tracking-wide">
                  receive an email each day when your score changes
                </p>
              </div>
              <Switch
                checked={dailyUpdatesEnabled}
                onCheckedChange={setDailyUpdatesEnabled}
                data-testid="toggle-daily-updates"
              />
            </div>
            {dailyUpdatesEnabled && !settings?.email && (
              <p className="text-xs text-amber-500 tracking-wide">
                no email found on your account — updates cannot be sent
              </p>
            )}
            {dailyUpdatesEnabled && settings?.email && (
              <p className="text-xs text-muted-foreground tracking-wide">
                updates will be sent to {settings.email} at 8:00 AM ET daily
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xs tracking-widest text-muted-foreground uppercase mb-4">profile adjustments</h2>
          <div className="border border-border/60 rounded p-4">
            <p className="text-xs text-muted-foreground tracking-wide mb-3">
              exclude roles, override company tiers, or mark internships to fine-tune your score.
            </p>
            <Link href="/profile-config">
              <button
                className="text-xs text-foreground tracking-wide underline underline-offset-4 hover:text-muted-foreground transition-colors"
                data-testid="link-profile-adjustments"
              >
                open profile adjustments →
              </button>
            </Link>
          </div>
        </section>

        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="h-8 px-6 text-xs tracking-wide font-mono"
            data-testid="button-save-settings"
          >
            {mutation.isPending ? "saving..." : "save settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
