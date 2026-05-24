import { useRef, useCallback } from "react";

interface AvaliacaoStockfish {
  centipawns: number;
  melhorLance: string | null;
  profundidade: number;
}

type MensagemWorker =
  | {
      tipo: "avaliacao";
      fen: string;
      centipawns: number;
      melhorLance: string | null;
      profundidade: number;
    }
  | { tipo: "pronto" }
  | { tipo: "erro"; mensagem: string };

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  const callbackRef = useRef<((avaliacao: AvaliacaoStockfish) => void) | null>(null);

  const analisar = useCallback((fen: string, profundidade = 18): Promise<AvaliacaoStockfish> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        workerRef.current = new Worker(new URL("../workers/stockfish.worker.ts", import.meta.url), {
          type: "module",
        });

        workerRef.current.onmessage = (e: MessageEvent<MensagemWorker>) => {
          const msg = e.data;
          if (msg.tipo === "avaliacao" && callbackRef.current) {
            callbackRef.current({
              centipawns: msg.centipawns,
              melhorLance: msg.melhorLance,
              profundidade: msg.profundidade,
            });
          }
          if (msg.tipo === "erro") reject(new Error(msg.mensagem));
        };
      }

      callbackRef.current = (avaliacao) => {
        callbackRef.current = null;
        resolve(avaliacao);
      };

      workerRef.current.postMessage({ tipo: "analisar", fen, profundidade });
    });
  }, []);

  const parar = useCallback(() => {
    workerRef.current?.postMessage({ tipo: "parar" });
    callbackRef.current = null;
  }, []);

  const desligar = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    callbackRef.current = null;
  }, []);

  return { analisar, parar, desligar };
}
