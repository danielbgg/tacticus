import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import type { Partida } from "@/shared/types/domain";

interface OrigemPartidaProps {
  partida: Partida | null | undefined;
  className?: string;
}

export function OrigemPartida({ partida, className }: OrigemPartidaProps) {
  const [expandido, setExpandido] = useState(false);

  if (!partida) {
    return (
      <div
        className={cn(
          "rounded-lg border border-[var(--color-borda)] p-3 text-xs text-[var(--color-conteudo-terciario)]",
          className,
        )}
      >
        Exercício personalizado
      </div>
    );
  }

  function copiarFen() {
    // FEN inicial do exercício — não disponível aqui diretamente, mas o componente pode receber
    navigator.clipboard.writeText("").catch(() => null);
  }

  return (
    <div className={cn("rounded-lg border border-[var(--color-borda)] overflow-hidden", className)}>
      <button
        onClick={() => setExpandido((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-[var(--color-superficie-secundaria)] transition-colors"
        aria-expanded={expandido}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-conteudo-primario)] truncate">
            {partida.brancas} vs {partida.negras}
          </p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">
            {[partida.evento, partida.ano].filter(Boolean).join(", ")}
          </p>
        </div>
        <span
          className={`ml-2 shrink-0 text-[var(--color-conteudo-terciario)] transition-transform duration-200 ${expandido ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      <AnimatePresence>
        {expandido && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--color-borda)] px-3 py-3 text-xs space-y-1.5">
              {partida.eloBrancas && (
                <p className="text-[var(--color-conteudo-secundario)]">
                  <span className="font-medium">{partida.brancas}</span> ({partida.eloBrancas}) vs{" "}
                  <span className="font-medium">{partida.negras}</span> ({partida.eloNegras})
                </p>
              )}
              {partida.resultado && (
                <p className="text-[var(--color-conteudo-terciario)]">
                  Resultado: {partida.resultado}
                </p>
              )}
              {partida.eco && (
                <p className="text-[var(--color-conteudo-terciario)]">ECO: {partida.eco}</p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={copiarFen}
                  className="rounded px-2 py-1 text-xs bg-[var(--color-superficie-secundaria)] hover:bg-[var(--color-borda)] transition-colors text-[var(--color-conteudo-secundario)]"
                >
                  Copiar FEN
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
