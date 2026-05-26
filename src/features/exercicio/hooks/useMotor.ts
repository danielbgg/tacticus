import { useEffect, useRef, useCallback, useState } from "react";
import { Chess } from "chess.js";
import type { AvaliacaoMotor } from "@/shared/types/domain";

type StatusMotor = "inativo" | "carregando" | "pronto" | "analisando" | "erro";

interface LinhaAnalise {
  depth: number;
  multipv: number;
  score: { tipo: "cp" | "mate"; valor: number };
  lances: string[]; // armazenados em SAN após conversão
}

interface UseMotorReturn {
  status: StatusMotor;
  linhas: LinhaAnalise[];
  melhorAvaliacao: AvaliacaoMotor | null;
  fenLinhas: string; // FEN para o qual 'linhas' foi gerado
  analisar: (fen: string, profundidade?: number) => void;
  parar: () => void;
}

// Converte lances UCI → SAN usando o FEN recebido junto com a mensagem do worker.
// A conversão acontece no momento da chegada (não na renderização), garantindo
// que o FEN e os lances sempre correspondam ao mesmo estado de jogo.
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
    return resultado.length > 0 ? resultado : lances;
  } catch {
    return lances;
  }
}

export function useMotor(): UseMotorReturn {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<StatusMotor>("inativo");
  const [linhas, setLinhas] = useState<LinhaAnalise[]>([]);
  const [melhorAvaliacao, setMelhorAvaliacao] = useState<AvaliacaoMotor | null>(null);
  const [fenLinhas, setFenLinhas] = useState<string>("");

  // FEN enviado mais recentemente ao worker — filtra mensagens obsoletas.
  // Ref (não state) para leitura síncrona nos handlers de mensagem.
  const ultimoFenRef = useRef<string>("");

  const garantirWorker = useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current;

    setStatus("carregando");
    setLinhas([]);
    setMelhorAvaliacao(null);

    let worker: Worker;
    try {
      worker = new Worker("/motor.worker.js");
    } catch {
      setStatus("erro");
      return null;
    }

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as { tipo: string; fen?: string; [k: string]: unknown };

      if (msg.tipo === "PRONTO") {
        setStatus("pronto");
        return;
      }

      if (msg.tipo === "LINHA_ANALISE") {
        if (msg.fen !== ultimoFenRef.current) return;

        const linha = msg as unknown as LinhaAnalise & { tipo: string; fen: string };
        // Converte os lances UCI → SAN usando o FEN que o worker está analisando.
        // Isso garante que o FEN e os lances são sempre do mesmo estado de jogo.
        const lancesSan = uciParaSan(linha.fen, linha.lances);
        setFenLinhas(linha.fen);
        setLinhas((prev) => {
          const sem = prev.filter((l) => l.multipv !== linha.multipv);
          return [
            ...sem,
            {
              depth: linha.depth,
              multipv: linha.multipv,
              score: linha.score,
              lances: lancesSan,
            },
          ].sort((a, b) => a.multipv - b.multipv);
        });
        return;
      }

      if (msg.tipo === "ANALISE_COMPLETA") {
        if (msg.fen !== ultimoFenRef.current) return;

        const fenCompleto = msg.fen as string;
        const melhorLanceUci = msg.melhorLance as string;
        const melhorLanceSan = uciParaSan(fenCompleto, [melhorLanceUci])[0] ?? melhorLanceUci;

        setLinhas((prev) => {
          const principal = prev.find((l) => l.multipv === 1);
          setMelhorAvaliacao({
            melhorLance: melhorLanceSan,
            centipawns: principal?.score.tipo === "cp" ? principal.score.valor : null,
            mate: principal?.score.tipo === "mate" ? principal.score.valor : null,
            profundidade: principal?.depth ?? 0,
            linha: principal?.lances ?? [],
          });
          return prev;
        });
        setStatus("pronto");
        return;
      }

      if (msg.tipo === "ANALISE_TIMEOUT") {
        setStatus("pronto");
        return;
      }

      if (msg.tipo === "ERRO") {
        setStatus("erro");
      }
    };

    worker.onerror = () => setStatus("erro");
    worker.postMessage({ tipo: "INICIALIZAR" });
    workerRef.current = worker;
    return worker;
  }, []);

  const analisar = useCallback(
    (fen: string, profundidade = 18) => {
      const worker = garantirWorker();
      if (!worker) return;

      ultimoFenRef.current = fen;
      setLinhas([]);
      setMelhorAvaliacao(null);
      setFenLinhas("");

      const enviar = () => {
        setStatus("analisando");
        worker.postMessage({ tipo: "ANALISAR", fen, profundidade, multiPV: 3 });
      };

      if (status === "carregando" || status === "inativo") {
        const original = worker.onmessage;
        worker.onmessage = (e: MessageEvent) => {
          if (original) original.call(worker, e);
          if ((e.data as { tipo: string }).tipo === "PRONTO") {
            worker.onmessage = original;
            enviar();
          }
        };
      } else {
        enviar();
      }
    },
    [garantirWorker, status],
  );

  const parar = useCallback(() => {
    workerRef.current?.postMessage({ tipo: "PARAR_ANALISE" });
    setStatus((s) => (s === "analisando" ? "pronto" : s));
  }, []);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ tipo: "ENCERRAR" });
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return { status, linhas, melhorAvaliacao, fenLinhas, analisar, parar };
}
