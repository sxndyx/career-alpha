import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link, useLocation } from "wouter";
import { LogOut, Upload, BarChart3, Trophy } from "lucide-react";

const navItems = [
  { path: "/upload", label: "upload", icon: Upload },
  { path: "/dashboard", label: "dashboard", icon: BarChart3 },
  { path: "/leaderboard", label: "leaderboard", icon: Trophy },
];

export function AppHeader() {
  const { user } = useAuth();
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border/60">
      <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-sm font-medium tracking-wider text-foreground" data-testid="text-header-logo">
              career<span className="text-muted-foreground">alpha</span>
            </span>
          </Link>

          <nav className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = location === item.path || (location === "/" && item.path === "/dashboard");
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`px-3 py-1.5 rounded text-xs tracking-wide transition-colors ${
                      isActive
                        ? "text-foreground bg-secondary/70"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`nav-${item.label}`}
                  >
                    {item.label}
                  </button>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button className="flex items-center gap-2" data-testid="button-user-menu">
            <span className="text-xs text-muted-foreground hidden sm:inline" data-testid="text-user-name">{user?.firstName || "user"}</span>
          </button>
          <a
            href="/api/logout"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Sign Out"
            data-testid="button-logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
