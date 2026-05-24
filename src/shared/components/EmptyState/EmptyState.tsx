import { Button } from "@/shared/components/Button/Button";

interface EmptyStateProps {
  icone?: string;
  titulo: string;
  descricao?: string;
  acaoLabel?: string;
  onAcao?: () => void;
}

export function EmptyState({ icone = "♟", titulo, descricao, acaoLabel, onAcao }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <span className="text-5xl" aria-hidden="true">
        {icone}
      </span>
      <h3 className="text-lg font-semibold text-[var(--color-conteudo-primario)]">{titulo}</h3>
      {descricao && (
        <p className="text-sm text-[var(--color-conteudo-secundario)] max-w-sm">{descricao}</p>
      )}
      {acaoLabel && onAcao && (
        <Button onClick={onAcao} variant="primary">
          {acaoLabel}
        </Button>
      )}
    </div>
  );
}
