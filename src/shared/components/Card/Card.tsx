import { cn } from "@/shared/lib/cn";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, style, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--raio-card)] border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] p-4",
        interactive && "cursor-pointer transition-all duration-150 hover:-translate-y-px",
        className,
      )}
      style={{
        boxShadow: interactive ? "var(--shadow-sm)" : "var(--shadow-sm)",
        ...style,
      }}
      {...props}
    />
  );
}
