import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-acento)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-acento)] text-white hover:bg-[var(--color-acento-hover)]",
        secondary:
          "border border-[var(--color-borda)] bg-[var(--color-superficie-secundaria)] hover:bg-[var(--color-borda)]",
        outline:
          "border border-[var(--color-borda)] bg-transparent hover:bg-[var(--color-superficie-secundaria)] text-[var(--color-conteudo-primario)]",
        ghost: "hover:bg-[var(--color-superficie-secundaria)]",
        danger: "bg-[var(--color-erro)] text-white hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, isLoading, children, disabled, ...props }, ref) => {
    const busy = loading ?? isLoading;
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? busy}
        aria-busy={busy}
        {...props}
      >
        {busy ? <span className="animate-spin">⟳</span> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
