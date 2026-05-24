import { Chessboard } from "react-chessboard";
import type { Square, Piece } from "react-chessboard/dist/chessboard/types";
import { cn } from "@/shared/lib/cn";
import type { EstiloTabuleiro, ConjuntoPecas } from "@/shared/types/domain";

interface Seta {
  origem: Square;
  destino: Square;
  cor?: string;
}

interface TabuleiroProps {
  fen?: string;
  orientacao?: "white" | "black";
  interativo?: boolean;
  estiloTabuleiro?: EstiloTabuleiro;
  conjuntoPecas?: ConjuntoPecas;
  ultimoLance?: { origem: Square; destino: Square } | null;
  setas?: Seta[];
  quadradosDestacados?: Square[];
  modoDaltonico?: boolean;
  onLance?: (origem: Square, destino: Square, peca: Piece) => boolean;
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
  interativo = false,
  estiloTabuleiro = "classico",
  ultimoLance,
  setas = [],
  quadradosDestacados = [],
  modoDaltonico = false,
  onLance,
  className,
}: TabuleiroProps) {
  const prefersReducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  const cores = modoDaltonico
    ? CORES_DALTONICO
    : (CORES_ESTILO[estiloTabuleiro] ?? CORES_ESTILO.classico);

  const estilosQuadrados: Record<string, React.CSSProperties> = {};

  if (ultimoLance) {
    const corUltimoLance = modoDaltonico ? "rgba(100, 160, 240, 0.5)" : "rgba(255, 255, 0, 0.4)";
    estilosQuadrados[ultimoLance.origem] = { backgroundColor: corUltimoLance };
    estilosQuadrados[ultimoLance.destino] = { backgroundColor: corUltimoLance };
  }

  for (const sq of quadradosDestacados) {
    estilosQuadrados[sq] = {
      backgroundColor: modoDaltonico ? "rgba(100, 200, 100, 0.6)" : "rgba(50, 200, 50, 0.5)",
    };
  }

  const setasFormatadas = setas.map((s): [Square, Square, string] => [
    s.origem,
    s.destino,
    s.cor ?? "rgb(0,128,0)",
  ]);

  return (
    <div className={cn("select-none", className)} aria-label="Tabuleiro de xadrez" role="img">
      <Chessboard
        position={fen}
        boardOrientation={orientacao}
        arePiecesDraggable={interativo}
        {...(onLance
          ? { onPieceDrop: (src: Square, dst: Square, piece: Piece) => onLance(src, dst, piece) }
          : {})}
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
