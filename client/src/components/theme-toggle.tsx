import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light" as const, icon: Sun, label: "Light" },
    { value: "dark" as const, icon: Moon, label: "Dark" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <div className="flex items-center rounded-md bg-secondary/60 p-0.5" data-testid="theme-toggle">
      {options.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`p-1.5 rounded transition-all duration-150 ${
              isActive
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={opt.label}
            data-testid={`theme-${opt.value}`}
          >
            <opt.icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}
