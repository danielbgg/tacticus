import { cn } from "@/shared/lib/cn";

interface ProgressProps {
  value: number; // 0–100
  className?: string;
  label?: string;
}

export function Progress({ value, className, label }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--color-borda)]", className)}
    >
      <div
        className="h-full rounded-full bg-[var(--color-acento)] transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
