import { useRef, useState, useLayoutEffect } from "react";
import { Chessboard } from "react-chessboard";
import type { Square, Piece, PromotionPieceOption } from "react-chessboard/dist/chessboard/types";
import { cn } from "@/shared/lib/cn";
import type { EstiloTabuleiro } from "@/shared/types/domain";

interface Seta {
  origem: Square;
  destino: Square;
  cor?: string;
}

export interface TabuleiroProps {
  fen?: string;
  orientacao?: "white" | "black";
  estiloTabuleiro?: EstiloTabuleiro;
  ultimoLance?: { origem: Square; destino: Square } | null;
  setas?: Seta[];
  casasDestacadas?: Record<string, React.CSSProperties>;
  modoDaltonico?: boolean;
  arrastavel?: boolean;
  onSquareClick?: (square: Square, piece?: Piece) => void;
  onPieceDrop?: (from: Square, to: Square, piece: Piece) => boolean;
  onPromotionPieceSelect?: (piece?: PromotionPieceOption, from?: Square, to?: Square) => boolean;
  className?: string;
}

const CORES_ESTILO: Record<EstiloTabuleiro, { claro: string; escuro: string }> = {
  classico: { claro: "#f0d9b5", escuro: "#b58863" },
  neo: { claro: "#dee3e6", escuro: "#8ca2ad" },
  madeira: { claro: "#e8c999", escuro: "#9b5e34" },
  marmore: { claro: "#f5f0e8", escuro: "#a8a8a8" },
  azul: { claro: "#dde8f0", escuro: "#4b7399" },
  verde: { claro: "#ffffdd", escuro: "#86a666" },
};

const CORES_DALTONICO = { claro: "#ffdd99", escuro: "#5577aa" };

export function Tabuleiro({
  fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  orientacao = "white",
  estiloTabuleiro = "classico",
  ultimoLance,
  setas = [],
  casasDestacadas = {},
  modoDaltonico = false,
  arrastavel = false,
  onSquareClick,
  onPieceDrop,
  onPromotionPieceSelect,
  className,
}: TabuleiroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(560);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const medir = () => {
      const w = el.offsetWidth;
      if (w > 0) setLargura(w);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const cores = modoDaltonico
    ? CORES_DALTONICO
    : (CORES_ESTILO[estiloTabuleiro] ?? CORES_ESTILO.classico);

  const estilosQuadrados: Record<string, React.CSSProperties> = { ...casasDestacadas };

  if (ultimoLance) {
    const cor = modoDaltonico ? "rgba(100, 160, 240, 0.5)" : "rgba(255, 255, 0, 0.4)";
    estilosQuadrados[ultimoLance.origem] = { backgroundColor: cor };
    estilosQuadrados[ultimoLance.destino] = { backgroundColor: cor };
  }

  const setasFormatadas = setas.map((s): [Square, Square, string] => [
    s.origem,
    s.destino,
    s.cor ?? "rgb(0,128,0)",
  ]);

  return (
    <div
      ref={containerRef}
      className={cn("select-none w-full", className)}
      aria-label="Tabuleiro de xadrez"
      role="img"
    >
      <Chessboard
        boardWidth={largura}
        position={fen}
        boardOrientation={orientacao}
        arePiecesDraggable={arrastavel}
        {...(onSquareClick ? { onSquareClick } : {})}
        {...(onPieceDrop ? { onPieceDrop } : {})}
        {...(onPromotionPieceSelect ? { onPromotionPieceSelect } : {})}
        customDarkSquareStyle={{ backgroundColor: cores.escuro }}
        customLightSquareStyle={{ backgroundColor: cores.claro }}
        customSquareStyles={estilosQuadrados}
        customArrows={setasFormatadas}
        animationDuration={prefersReducedMotion ? 0 : 200}
        areArrowsAllowed={false}
      />
    </div>
  );
}
