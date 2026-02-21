import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/60">
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
          <span className="text-sm font-medium tracking-wider" data-testid="text-logo">
            career<span className="text-muted-foreground">alpha</span>
          </span>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <a href="/api/login">
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide" data-testid="button-login-nav">
                sign in
              </button>
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-12">
        <section className="max-w-5xl mx-auto px-6 pt-32 pb-24">
          <div className="max-w-2xl">
            <div className="text-xs text-muted-foreground tracking-widest uppercase mb-6">career intelligence</div>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.15] mb-6" data-testid="text-hero-title">
              quantify your<br />career alpha
            </h1>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-10" data-testid="text-hero-subtitle">
              upload your linkedin data export and receive a weighted composite score, percentile ranking, and actionable insights tailored to your career track.
            </p>
            <div className="flex items-center gap-4">
              <a href="/api/login">
                <Button className="gap-2 text-xs tracking-wide px-6" data-testid="button-get-started">
                  get started
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
            <div className="flex items-center gap-6 mt-10 text-xs text-muted-foreground">
              <span>no scraping</span>
              <span className="text-border">|</span>
              <span>3 career tracks</span>
              <span className="text-border">|</span>
              <span>instant analysis</span>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-xs text-muted-foreground tracking-widest uppercase mb-12" data-testid="text-how-it-works">how it works</div>
            <div className="grid md:grid-cols-3 gap-12">
              <div data-testid="card-step-1">
                <div className="text-xs font-mono text-muted-foreground mb-3">01</div>
                <h3 className="text-sm font-medium mb-2">upload linkedin data</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  export your linkedin data as a zip or csv file and upload it securely. no scraping, no api access needed.
                </p>
              </div>
              <div data-testid="card-step-2">
                <div className="text-xs font-mono text-muted-foreground mb-3">02</div>
                <h3 className="text-sm font-medium mb-2">get your score</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  our engine computes 9 weighted factors including brand score, skill density, and seniority progression.
                </p>
              </div>
              <div data-testid="card-step-3">
                <div className="text-xs font-mono text-muted-foreground mb-3">03</div>
                <h3 className="text-sm font-medium mb-2">compare & improve</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  see your percentile ranking, view factor breakdowns, and get actionable recommendations.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-xs text-muted-foreground tracking-widest uppercase mb-12">career tracks</div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-5 rounded border border-border/60" data-testid="card-track-swe">
                <div className="text-lg font-mono font-bold mb-1">SWE</div>
                <div className="text-xs text-muted-foreground mb-4">software engineering</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">internship count</span><span className="font-mono">25%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">brand score</span><span className="font-mono">20%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">skill density</span><span className="font-mono">20%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">education tier</span><span className="font-mono">15%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">seniority</span><span className="font-mono">10%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">network</span><span className="font-mono">10%</span></div>
                </div>
              </div>
              <div className="p-5 rounded border border-border/60" data-testid="card-track-finance">
                <div className="text-lg font-mono font-bold mb-1">IB/CF</div>
                <div className="text-xs text-muted-foreground mb-4">investment banking</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">brand score</span><span className="font-mono">30%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">internship count</span><span className="font-mono">25%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">education tier</span><span className="font-mono">20%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">consistency</span><span className="font-mono">15%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">network</span><span className="font-mono">10%</span></div>
                </div>
              </div>
              <div className="p-5 rounded border border-border/60" data-testid="card-track-am">
                <div className="text-lg font-mono font-bold mb-1">AM</div>
                <div className="text-xs text-muted-foreground mb-4">asset management</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">internship count</span><span className="font-mono">30%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">brand score</span><span className="font-mono">25%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">education tier</span><span className="font-mono">20%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">recency</span><span className="font-mono">15%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">network</span><span className="font-mono">10%</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/60 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-lg font-medium mb-3">ready to measure your edge?</h2>
            <p className="text-xs text-muted-foreground mb-8 max-w-md">
              join the platform built for ambitious professionals who want data-driven career insights.
            </p>
            <a href="/api/login">
              <Button className="gap-2 text-xs tracking-wide px-6" data-testid="button-cta-bottom">
                start your analysis
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>careeralpha</span>
          <span>your data stays private</span>
        </div>
      </footer>
    </div>
  );
}
