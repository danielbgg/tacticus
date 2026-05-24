import { useState, useCallback } from "react";
import { Chess } from "chess.js";
import { Tabuleiro } from "@/shared/components/Tabuleiro/Tabuleiro";
import { Button } from "@/shared/components/Button/Button";
import type { EstiloTabuleiro } from "@/shared/types/domain";

interface VisualizadorLancesProps {
  fenInicial?: string;
  lances: string[]; // em SAN ou UCI
  estiloTabuleiro?: EstiloTabuleiro;
  className?: string;
}

function reconstruirFens(fenInicial: string, lances: string[]): string[] {
  const fens = [fenInicial];
  const chess = new Chess(fenInicial);
  for (const lance of lances) {
    try {
      chess.move(lance);
      fens.push(chess.fen());
    } catch {
      break;
    }
  }
  return fens;
}

export function VisualizadorLances({
  fenInicial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  lances,
  estiloTabuleiro = "classico",
  className,
}: VisualizadorLancesProps) {
  const fens = reconstruirFens(fenInicial, lances);
  const [indice, setIndice] = useState(0);

  const ir = useCallback(
    (i: number) => {
      setIndice(Math.max(0, Math.min(fens.length - 1, i)));
    },
    [fens.length],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") ir(indice - 1);
      if (e.key === "ArrowRight") ir(indice + 1);
      if (e.key === "Home") ir(0);
      if (e.key === "End") ir(fens.length - 1);
    },
    [indice, ir, fens.length],
  );

  const fenAtual = fens[indice] ?? fenInicial;

  return (
    <div
      className={className}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Visualizador de lances"
    >
      <Tabuleiro fen={fenAtual} estiloTabuleiro={estiloTabuleiro} className="w-full" />

      <div className="mt-2 flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => ir(0)}
          disabled={indice === 0}
          aria-label="Início"
        >
          ⏮
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => ir(indice - 1)}
          disabled={indice === 0}
          aria-label="Lance anterior"
        >
          ◀
        </Button>
        <span className="text-sm text-[var(--color-conteudo-terciario)] min-w-[60px] text-center">
          {indice}/{fens.length - 1}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => ir(indice + 1)}
          disabled={indice >= fens.length - 1}
          aria-label="Próximo lance"
        >
          ▶
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => ir(fens.length - 1)}
          disabled={indice >= fens.length - 1}
          aria-label="Fim"
        >
          ⏭
        </Button>
      </div>

      {lances.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1" role="list" aria-label="Lista de lances">
          {lances.map((lance, i) => {
            const numLance = Math.floor(i / 2) + 1;
            const eBrancas = i % 2 === 0;
            return (
              <button
                key={i}
                role="listitem"
                onClick={() => ir(i + 1)}
                className={`rounded px-1.5 py-0.5 text-xs font-mono transition-colors ${
                  indice === i + 1
                    ? "bg-[var(--color-acento)] text-white"
                    : "hover:bg-[var(--color-superficie-secundaria)] text-[var(--color-conteudo-secundario)]"
                }`}
                aria-current={indice === i + 1 ? "true" : undefined}
              >
                {eBrancas && (
                  <span className="text-[var(--color-conteudo-terciario)] mr-0.5">{numLance}.</span>
                )}
                {lance}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
