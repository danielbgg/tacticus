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
  fenLinhas: string; // FEN para o qual 'linhas' foi gerado — usar em uciParaSan
  analisar: (fen: string, profundidade?: number) => void;
  parar: () => void;
}

export function useMotor(): UseMotorReturn {
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState<StatusMotor>("inativo");
  const [linhas, setLinhas] = useState<LinhaAnalise[]>([]);
  const [melhorAvaliacao, setMelhorAvaliacao] = useState<AvaliacaoMotor | null>(null);
  const [fenLinhas, setFenLinhas] = useState<string>("");

  // FEN que foi enviado mais recentemente ao worker — filtra mensagens obsoletas.
  // Usa ref (não state) para leitura síncrona dentro dos handlers de mensagem.
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
        // Descarta mensagens de análises anteriores pelo FEN
        if (msg.fen !== ultimoFenRef.current) return;

        const linha = msg as unknown as LinhaAnalise & { tipo: string; fen: string };
        setFenLinhas(linha.fen);
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
        if (msg.fen !== ultimoFenRef.current) return;

        const melhorLance = msg.melhorLance as string;
        setLinhas((prev) => {
          const principal = prev.find((l) => l.multipv === 1);
          setMelhorAvaliacao({
            melhorLance,
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

      // Atualiza ref ANTES de limpar estado — garante que qualquer mensagem
      // com fen diferente chegando logo depois seja filtrada corretamente.
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
