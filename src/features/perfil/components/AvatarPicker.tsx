import { cn } from "@/shared/lib/cn";

const AVATARES = ["♙", "♘", "♗", "♖", "♕", "♔", "♟", "♞", "♝", "♜", "♛", "♚"];

interface AvatarPickerProps {
  valor: string;
  onChange: (avatar: string) => void;
  className?: string;
}

export function AvatarPicker({ valor, onChange, className }: AvatarPickerProps) {
  return (
    <fieldset className={cn("flex flex-wrap gap-2", className)}>
      <legend className="mb-2 text-sm font-medium text-[var(--color-conteudo-primario)]">
        Escolha seu avatar
      </legend>
      {AVATARES.map((avatar) => (
        <button
          key={avatar}
          type="button"
          aria-label={`Avatar ${avatar}`}
          aria-pressed={valor === avatar}
          onClick={() => onChange(avatar)}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg border-2 text-2xl transition-colors",
            valor === avatar
              ? "border-[var(--color-acento)] bg-[var(--color-acento)]/10"
              : "border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] hover:border-[var(--color-acento)]/50",
          )}
        >
          {avatar}
        </button>
      ))}
    </fieldset>
  );
}
