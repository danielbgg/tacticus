import { useState, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import { useMotor } from "@/features/exercicio/hooks/useMotor";
import { Button } from "@/shared/components/Button/Button";

interface PainelMotorProps {
  fen: string;
}

function formatarScore(
  score: { tipo: "cp" | "mate"; valor: number },
  orientacao: "w" | "b",
): string {
  const sinal = orientacao === "b" ? -1 : 1;
  if (score.tipo === "mate") {
    const m = score.valor * sinal;
    return m > 0 ? `Mate em ${m}` : `Mate em ${Math.abs(m)} (contra)`;
  }
  const cp = (score.valor * sinal) / 100;
  return cp > 0 ? `+${cp.toFixed(2)}` : `${cp.toFixed(2)}`;
}

function corScore(score: { tipo: "cp" | "mate"; valor: number }, orientacao: "w" | "b"): string {
  if (score.tipo === "mate") {
    return score.valor * (orientacao === "b" ? -1 : 1) > 0
      ? "text-[var(--color-sucesso)]"
      : "text-[var(--color-erro)]";
  }
  const cp = (score.valor * (orientacao === "b" ? -1 : 1)) / 100;
  if (cp > 0.5) return "text-[var(--color-sucesso)]";
  if (cp < -0.5) return "text-[var(--color-erro)]";
  return "text-[var(--color-conteudo-secundario)]";
}

function turnoDoFen(fen: string): "w" | "b" {
  return fen.split(" ")[1] === "b" ? "b" : "w";
}

function uciParaSan(fen: string, lances: string[]): string[] {
  try {
    const chess = new Chess(fen);
    const resultado: string[] = [];
    for (const lance of lances) {
      const from = lance.slice(0, 2);
      const to = lance.slice(2, 4);
      const promotion = lance.length === 5 ? lance[4] : undefined;
      const move = chess.move(promotion ? { from, to, promotion } : { from, to });
      if (!move) break;
      resultado.push(move.san);
    }
    return resultado;
  } catch {
    return lances;
  }
}

export function PainelMotor({ fen }: PainelMotorProps) {
  const { status, linhas, melhorAvaliacao, analisar, parar } = useMotor();
  const [aberto, setAberto] = useState(false);

  // Quando o FEN muda (novo exercício) e o painel está aberto, re-analisa automaticamente.
  // Não verifica status — o worker para a análise anterior antes de começar a nova.
  useEffect(() => {
    if (aberto && fen) {
      analisar(fen, 18);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  const handleAnalisar = useCallback(() => {
    if (!aberto) setAberto(true);
    if (status === "analisando") {
      parar();
    } else {
      analisar(fen, 18);
    }
  }, [aberto, status, fen, analisar, parar]);

  const orientacao = turnoDoFen(fen);
  const principal = linhas.find((l) => l.multipv === 1);

  return (
    <div className="rounded-xl border border-[var(--color-borda)] bg-[var(--color-superficie)] px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-conteudo-terciario)]">
          Motor
        </p>
        {status === "erro" && (
          <span className="text-xs text-red-400">stockfish.js não encontrado</span>
        )}
        {principal && status !== "analisando" && (
          <span className={`text-sm font-bold font-mono ${corScore(principal.score, orientacao)}`}>
            {formatarScore(principal.score, orientacao)}
          </span>
        )}
        {status === "analisando" && (
          <span className="text-xs text-[var(--color-acento)] animate-pulse">
            prof. {principal?.depth ?? 0}
          </span>
        )}
      </div>

      <Button
        variant={status === "analisando" ? "secondary" : "primary"}
        size="sm"
        onClick={handleAnalisar}
        isLoading={status === "carregando"}
        className="w-full"
      >
        {status === "analisando" ? "Parar análise" : "Analisar posição"}
      </Button>

      {aberto && linhas.length > 0 && (
        <div className="mt-3 space-y-2">
          {linhas.map((linha) => (
            <div
              key={linha.multipv}
              className="rounded-lg bg-[var(--color-superficie-secundaria)] px-3 py-2"
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold font-mono ${corScore(linha.score, orientacao)}`}
                >
                  {formatarScore(linha.score, orientacao)}
                </span>
                <span className="text-xs text-[var(--color-conteudo-terciario)]">
                  prof. {linha.depth}
                </span>
              </div>
              <p className="font-mono text-xs text-[var(--color-conteudo-secundario)] truncate">
                {uciParaSan(fen, linha.lances).slice(0, 6).join(" ")}
              </p>
            </div>
          ))}
        </div>
      )}

      {aberto && melhorAvaliacao && (
        <p className="mt-2 text-xs text-[var(--color-conteudo-terciario)]">
          {melhorAvaliacao.melhorLance && melhorAvaliacao.melhorLance !== "(none)" ? (
            <>
              Melhor lance:{" "}
              <span className="font-mono font-medium text-[var(--color-conteudo-primario)]">
                {uciParaSan(fen, [melhorAvaliacao.melhorLance])[0] ?? melhorAvaliacao.melhorLance}
              </span>
            </>
          ) : (
            <span className="font-medium text-[var(--color-sucesso)]">Posição terminal</span>
          )}
        </p>
      )}
    </div>
  );
}
