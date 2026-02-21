interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
  size = "md",
}: SegmentedControlProps<T>) {
  const sizeClasses = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-xs";

  return (
    <div className={`inline-flex items-center rounded-md bg-secondary/60 p-0.5 ${className}`}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`${sizeClasses} rounded transition-all duration-150 font-medium tracking-wide whitespace-nowrap ${
              isActive
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`segment-${opt.value}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
