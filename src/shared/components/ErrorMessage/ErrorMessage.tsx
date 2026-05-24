import { Button } from "@/shared/components/Button/Button";

interface ErrorMessageProps {
  mensagem?: string;
  onTentar?: () => void;
}

export function ErrorMessage({
  mensagem = "Ocorreu um erro inesperado.",
  onTentar,
}: ErrorMessageProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-12 text-center">
      <span className="text-4xl" aria-hidden="true">
        ⚠
      </span>
      <p className="text-[var(--color-conteudo-secundario)]">{mensagem}</p>
      {onTentar && (
        <Button variant="secondary" onClick={onTentar}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
