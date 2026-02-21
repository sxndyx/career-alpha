import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
import LandingPage from "@/pages/landing";
import UploadPage from "@/pages/upload";
import SelectTrackPage from "@/pages/select-track";
import DashboardPage from "@/pages/dashboard";
import LeaderboardPage from "@/pages/leaderboard";
import NotFound from "@/pages/not-found";

function AuthenticatedRoutes() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/upload" component={UploadPage} />
        <Route path="/select-track" component={SelectTrackPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/leaderboard" component={LeaderboardPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-mono text-muted-foreground animate-pulse tracking-widest">ca_</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return <AuthenticatedRoutes />;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
