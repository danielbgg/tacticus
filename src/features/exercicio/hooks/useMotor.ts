import { useEffect, useRef, useCallback, useState } from "react";
import type { AvaliacaoMotor } from "@/shared/types/domain";

interface UseMotorOptions {
  ativo?: boolean;
  profundidade?: number;
}

export function useMotor({ ativo = false, profundidade = 18 }: UseMotorOptions = {}) {
  const workerRef = useRef<Worker | null>(null);
  const [avaliacao, setAvaliacao] = useState<AvaliacaoMotor | null>(null);
  const [pronto, setPronto] = useState(false);
  const [analisando, setAnalisando] = useState(false);

  useEffect(() => {
    if (!ativo) return;

    const worker = new Worker(new URL("../workers/stockfish.worker.ts", import.meta.url), {
      type: "module",
    });

    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data as { tipo: string; [key: string]: unknown };
      if (msg.tipo === "pronto") {
        setPronto(true);
      } else if (msg.tipo === "avaliacao") {
        setAvaliacao({
          melhorLance: msg.melhorLance as string,
          centipawns: msg.centipawns as number | null,
          mate: msg.mate as number | null,
          profundidade: msg.profundidade as number,
          linha: msg.linha as string[],
        });
        setAnalisando(false);
      } else if (msg.tipo === "erro") {
        setAnalisando(false);
      }
    };

    return () => {
      worker.postMessage({ tipo: "desligar" });
      worker.terminate();
      workerRef.current = null;
      setPronto(false);
      setAnalisando(false);
    };
  }, [ativo]);

  const analisar = useCallback(
    (fen: string) => {
      if (!workerRef.current || !pronto) return;
      setAnalisando(true);
      setAvaliacao(null);
      workerRef.current.postMessage({ tipo: "analisar", fen, profundidade });
    },
    [pronto, profundidade],
  );

  const parar = useCallback(() => {
    workerRef.current?.postMessage({ tipo: "parar" });
    setAnalisando(false);
  }, []);

  return { avaliacao, pronto, analisando, analisar, parar };
}
