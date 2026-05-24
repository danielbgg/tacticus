import { cn } from "@/shared/lib/cn";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { Button } from "@/shared/components/Button/Button";

interface HintPanelProps {
  onUsarDica: () => void;
  className?: string;
}

const PENALIDADES = ["−20% XP", "−50% XP", "Conta como erro"];
const DESCRICOES = [
  "Destaca a peça que deve mover",
  "Mostra a casa de destino",
  "Revela o lance completo",
];

export function HintPanel({ onUsarDica, className }: HintPanelProps) {
  const dicasUsadas = useSessaoStore((s) => s.dicasUsadas);
  const fase = useSessaoStore((s) => s.fase);
  const desabilitado = dicasUsadas >= 3 || fase !== "tentando";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-conteudo-primario)]">Dicas</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-6 rounded-full transition-colors",
                i < dicasUsadas ? "bg-orange-400" : "bg-[var(--color-borda)]",
              )}
              aria-label={i < dicasUsadas ? `Dica ${i + 1} usada` : `Dica ${i + 1} disponível`}
            />
          ))}
        </div>
      </div>

      {dicasUsadas < 3 && (
        <div className="rounded-lg border border-[var(--color-borda)] p-3 text-sm">
          <p className="text-[var(--color-conteudo-secundario)]">{DESCRICOES[dicasUsadas] ?? ""}</p>
          <p className="mt-1 text-xs text-orange-500">{PENALIDADES[dicasUsadas] ?? ""}</p>
        </div>
      )}

      <Button
        variant="secondary"
        size="sm"
        onClick={onUsarDica}
        disabled={desabilitado}
        aria-label={`Usar dica ${dicasUsadas + 1} de 3`}
      >
        {dicasUsadas >= 3 ? "Sem dicas disponíveis" : `Usar dica (${dicasUsadas}/3)`}
      </Button>
    </div>
  );
}
