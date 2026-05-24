import { cn } from "@/shared/lib/cn";
import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--raio-card)] border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] p-4 shadow-sm",
        interactive && "cursor-pointer transition-shadow hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}
