import { useState, useCallback, useEffect, useRef } from "react";
import type { Square, Piece } from "react-chessboard/dist/chessboard/types";
import { Chess } from "chess.js";
import { Tabuleiro } from "@/shared/components/Tabuleiro/Tabuleiro";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import type { EstiloTabuleiro, ConjuntoPecas } from "@/shared/types/domain";

interface TabuleiroInterativoProps {
  onLanceCorreto: (tempoMs: number) => void;
  onLanceErrado: (tempoMs: number) => void;
  estiloTabuleiro?: EstiloTabuleiro;
  conjuntoPecas?: ConjuntoPecas;
  modoDaltonico?: boolean;
}

export function TabuleiroInterativo({
  onLanceCorreto,
  onLanceErrado,
  estiloTabuleiro = "classico",
  modoDaltonico = false,
}: TabuleiroInterativoProps) {
  const { exercicioAtual, fase } = useSessaoStore();
  const [fenAtual, setFenAtual] = useState(exercicioAtual?.fenInicial ?? "");
  const [indiceEsperado, setIndiceEsperado] = useState(0);
  const [ultimoLance, setUltimoLance] = useState<{ origem: Square; destino: Square } | null>(null);
  const inicioRef = useRef<number>(Date.now());

  useEffect(() => {
    if (exercicioAtual) {
      setFenAtual(exercicioAtual.fenInicial);
      setIndiceEsperado(0);
      setUltimoLance(null);
      inicioRef.current = Date.now();
    }
  }, [exercicioAtual?.id]);

  const handleLance = useCallback(
    (origem: Square, destino: Square, _peca: Piece): boolean => {
      if (!exercicioAtual || fase !== "tentando") return false;

      const chess = new Chess(fenAtual);
      const resultado = chess.move({ from: origem, to: destino, promotion: "q" });
      if (!resultado) return false;

      const lanceUci = origem + destino;
      const lanceEsperado = exercicioAtual.lancesSolucao[indiceEsperado];
      const tempoMs = Date.now() - inicioRef.current;

      setUltimoLance({ origem, destino });

      if (lanceUci === lanceEsperado || resultado.san === lanceEsperado) {
        setFenAtual(chess.fen());
        const proximo = indiceEsperado + 1;
        if (proximo >= exercicioAtual.lancesSolucao.length) {
          onLanceCorreto(tempoMs);
        } else {
          setIndiceEsperado(proximo);
          // Resposta automática do computador (lance seguinte na solução)
          const lanceResposta = exercicioAtual.lancesSolucao[proximo];
          if (lanceResposta) {
            setTimeout(() => {
              const chess2 = new Chess(chess.fen());
              const from = lanceResposta.slice(0, 2) as Square;
              const to = lanceResposta.slice(2, 4) as Square;
              chess2.move({ from, to, promotion: "q" });
              setFenAtual(chess2.fen());
              setUltimoLance({ origem: from, destino: to });
              setIndiceEsperado(proximo + 1);
            }, 400);
          }
        }
      } else {
        setFenAtual(exercicioAtual.fenInicial);
        setIndiceEsperado(0);
        setUltimoLance(null);
        onLanceErrado(tempoMs);
      }

      return true;
    },
    [exercicioAtual, fase, fenAtual, indiceEsperado, onLanceCorreto, onLanceErrado],
  );

  if (!exercicioAtual) return null;

  const chess = new Chess(fenAtual);
  const orientacao = chess.turn() === "w" ? "white" : "black";

  return (
    <Tabuleiro
      fen={fenAtual}
      orientacao={orientacao}
      interativo={fase === "tentando"}
      estiloTabuleiro={estiloTabuleiro}
      ultimoLance={ultimoLance}
      modoDaltonico={modoDaltonico}
      onLance={handleLance}
      className="max-w-[560px] w-full mx-auto"
    />
  );
}
