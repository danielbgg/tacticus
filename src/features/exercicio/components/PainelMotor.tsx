import { useState, useCallback, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { useMotor } from "@/features/exercicio/hooks/useMotor";
import { Button } from "@/shared/components/Button/Button";

interface PainelMotorProps {
  fen: string;
  exercicioId?: string | undefined;
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

// Converte lances UCI em SAN usando o FEN exato da posição analisada.
function uciParaSan(fen: string, lances: string[]): string[] {
  if (!fen || lances.length === 0) return lances;
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

export function PainelMotor({ fen, exercicioId }: PainelMotorProps) {
  const { status, linhas, melhorAvaliacao, fenLinhas, analisar, parar } = useMotor();
  const [aberto, setAberto] = useState(false);
  // FEN capturado no momento em que o usuário clicou "Analisar" — não muda com movimentos do board
  const fenAnaliseRef = useRef<string>("");

  // Ao trocar de exercício: fecha o painel e encerra a análise
  useEffect(() => {
    setAberto(false);
    parar();
    fenAnaliseRef.current = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercicioId]);

  const handleAnalisar = useCallback(() => {
    if (status === "analisando") {
      parar();
      setAberto(false);
    } else {
      fenAnaliseRef.current = fen;
      setAberto(true);
      analisar(fen, 18);
    }
  }, [status, fen, analisar, parar]);

  // fenAnaliseRef.current é o FEN que foi enviado ao worker.
  // fenLinhas é o FEN do qual as linhas foram geradas (atualizado a cada mensagem do worker).
  // Só exibe linhas quando fenLinhas coincide com o FEN da análise atual.
  const fenDaAnalise = fenAnaliseRef.current;
  const linhesValidas = fenLinhas && fenLinhas === fenDaAnalise ? linhas : [];
  const orientacao = turnoDoFen(fenDaAnalise || fen);
  const principal = linhesValidas.find((l) => l.multipv === 1);

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

      {aberto && linhesValidas.length > 0 && (
        <div className="mt-3 space-y-2">
          {linhesValidas.map((linha) => (
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
                {uciParaSan(fenDaAnalise, linha.lances).slice(0, 6).join(" ")}
              </p>
            </div>
          ))}
        </div>
      )}

      {aberto && melhorAvaliacao && linhesValidas.length > 0 && (
        <p className="mt-2 text-xs text-[var(--color-conteudo-terciario)]">
          {melhorAvaliacao.melhorLance && melhorAvaliacao.melhorLance !== "(none)" ? (
            <>
              Melhor lance:{" "}
              <span className="font-mono font-medium text-[var(--color-conteudo-primario)]">
                {uciParaSan(fenDaAnalise, [melhorAvaliacao.melhorLance])[0] ??
                  melhorAvaliacao.melhorLance}
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
