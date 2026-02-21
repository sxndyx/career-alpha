import { Button } from "@/components/ui/button";
import { TrendingUp, Upload, BarChart3, Trophy, ArrowRight, Zap, Shield, Target } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg tracking-tight" data-testid="text-logo">CareerAlpha</span>
          </div>
          <a href="/api/login">
            <Button data-testid="button-login-nav">Sign In</Button>
          </a>
        </div>
      </nav>

      <main className="pt-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-chart-2/5 rounded-full blur-3xl" />
          
          <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm mb-8">
                <Zap className="w-3.5 h-3.5" />
                <span>Career Intelligence Platform</span>
              </div>
              
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6" data-testid="text-hero-title">
                Quantify Your
                <br />
                <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                  Career Alpha
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed" data-testid="text-hero-subtitle">
                Upload your LinkedIn data export and receive a weighted composite score, percentile ranking, and actionable insights tailored to your career track.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
                <a href="/api/login">
                  <Button size="lg" className="gap-2 text-base px-8" data-testid="button-get-started">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
              
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>No scraping</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  <span>3 career tracks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Instant analysis</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4" data-testid="text-how-it-works">How It Works</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Three steps to quantify your competitive advantage</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="group relative p-8 rounded-md bg-card border border-card-border" data-testid="card-step-1">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-5">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-2">01</div>
                <h3 className="text-lg font-semibold mb-2">Upload LinkedIn Data</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Export your LinkedIn data as a ZIP or CSV file and upload it securely. No scraping, no API access needed.
                </p>
              </div>
              
              <div className="group relative p-8 rounded-md bg-card border border-card-border" data-testid="card-step-2">
                <div className="w-12 h-12 rounded-md bg-chart-2/10 flex items-center justify-center mb-5">
                  <BarChart3 className="w-5 h-5 text-chart-2" />
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-2">02</div>
                <h3 className="text-lg font-semibold mb-2">Get Your Score</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our engine computes 9 weighted factors including brand score, skill density, and seniority progression.
                </p>
              </div>
              
              <div className="group relative p-8 rounded-md bg-card border border-card-border" data-testid="card-step-3">
                <div className="w-12 h-12 rounded-md bg-chart-4/10 flex items-center justify-center mb-5">
                  <Trophy className="w-5 h-5 text-chart-4" />
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-2">03</div>
                <h3 className="text-lg font-semibold mb-2">Compare & Improve</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  See your percentile ranking, view factor breakdowns, and get actionable recommendations to climb higher.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Career Tracks</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Optimized scoring for your target industry</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-md bg-card border border-card-border" data-testid="card-track-swe">
                <div className="text-2xl font-mono font-bold text-primary mb-1">SWE</div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Software Engineering</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Internship Count</span><span className="font-mono">25%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Brand Score</span><span className="font-mono">20%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Skill Density</span><span className="font-mono">20%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Education Tier</span><span className="font-mono">15%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Seniority</span><span className="font-mono">10%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Network</span><span className="font-mono">10%</span></div>
                </div>
              </div>
              
              <div className="p-6 rounded-md bg-card border border-card-border" data-testid="card-track-finance">
                <div className="text-2xl font-mono font-bold text-chart-2 mb-1">IB/CF</div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Investment Banking</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Brand Score</span><span className="font-mono">30%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Internship Count</span><span className="font-mono">25%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Education Tier</span><span className="font-mono">20%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Consistency</span><span className="font-mono">15%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Network</span><span className="font-mono">10%</span></div>
                </div>
              </div>
              
              <div className="p-6 rounded-md bg-card border border-card-border" data-testid="card-track-am">
                <div className="text-2xl font-mono font-bold text-chart-4 mb-1">AM</div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Asset Management</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Internship Count</span><span className="font-mono">30%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Brand Score</span><span className="font-mono">25%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Education Tier</span><span className="font-mono">20%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Recency</span><span className="font-mono">15%</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Network</span><span className="font-mono">10%</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 border-t border-border/50">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Ready to measure your edge?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join the platform built for ambitious professionals who want data-driven career insights.
            </p>
            <a href="/api/login">
              <Button size="lg" className="gap-2 px-8" data-testid="button-cta-bottom">
                Start Your Analysis
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>CareerAlpha</span>
          <span>No LinkedIn scraping. Your data stays private.</span>
        </div>
      </footer>
    </div>
  );
}
