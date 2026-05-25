import { useEffect, useRef, useCallback, useState } from "react";
import type { AvaliacaoMotor } from "@/shared/types/domain";

type StatusMotor = "inativo" | "carregando" | "pronto" | "analisando" | "erro";

interface LinhaAnalise {
  depth: number;
  multipv: number;
  score: { tipo: "cp" | "mate"; valor: number };
  lances: string[];
}

interface UseMotorReturn {
  status: StatusMotor;
  linhas: LinhaAnalise[];
  melhorAvaliacao: AvaliacaoMotor | null;
  analisar: (fen: string, profundidade?: number) => void;
  parar: () => void;
}

export function useMotor(): UseMotorReturn {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<StatusMotor>("inativo");
  const [linhas, setLinhas] = useState<LinhaAnalise[]>([]);
  const [melhorAvaliacao, setMelhorAvaliacao] = useState<AvaliacaoMotor | null>(null);

  // Inicializa o worker sob demanda (na primeira chamada de analisar)
  const garantirWorker = useCallback((): Worker | null => {
    if (workerRef.current) return workerRef.current;

    setStatus("carregando");
    setLinhas([]);
    setMelhorAvaliacao(null);

    let worker: Worker;
    try {
      worker = new Worker(new URL("@/workers/motor.worker.ts", import.meta.url), {
        type: "classic",
      });
    } catch {
      setStatus("erro");
      return null;
    }

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as { tipo: string; [k: string]: unknown };

      if (msg.tipo === "PRONTO") {
        setStatus("pronto");
        return;
      }

      if (msg.tipo === "LINHA_ANALISE") {
        const linha = msg as unknown as LinhaAnalise & { tipo: string };
        setLinhas((prev) => {
          const sem = prev.filter((l) => l.multipv !== linha.multipv);
          return [
            ...sem,
            {
              depth: linha.depth,
              multipv: linha.multipv,
              score: linha.score,
              lances: linha.lances,
            },
          ].sort((a, b) => a.multipv - b.multipv);
        });
        return;
      }

      if (msg.tipo === "ANALISE_COMPLETA") {
        const melhorLance = msg.melhorLance as string;
        setLinhas((prev) => {
          const principal = prev.find((l) => l.multipv === 1);
          if (principal) {
            setMelhorAvaliacao({
              melhorLance,
              centipawns: principal.score.tipo === "cp" ? principal.score.valor : null,
              mate: principal.score.tipo === "mate" ? principal.score.valor : null,
              profundidade: principal.depth,
              linha: principal.lances,
            });
          }
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

      setLinhas([]);
      setMelhorAvaliacao(null);

      const enviar = () => {
        setStatus("analisando");
        worker.postMessage({ tipo: "ANALISAR", fen, profundidade, multiPV: 3 });
      };

      // Se ainda carregando, aguarda PRONTO antes de enviar
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

  return { status, linhas, melhorAvaliacao, analisar, parar };
}
