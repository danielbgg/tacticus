import { useRef, useState, useLayoutEffect } from "react";
import { Chessboard, ChessboardDnDProvider } from "react-chessboard";
import { TouchBackend } from "react-dnd-touch-backend";
import type { Square, Piece, PromotionPieceOption } from "react-chessboard/dist/chessboard/types";
import { cn } from "@/shared/lib/cn";
import type { EstiloTabuleiro } from "@/shared/types/domain";
import { MAESTRO_PIECES } from "./maestroPieces";

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

// TouchBackend config — usa pointer/mouse events em vez de HTML5 drag (compatível com WKWebView)
const DND_BACKEND_OPTIONS = { enableMouseEvents: true };

// Paleta de cores por estilo
const CORES_ESTILO: Record<EstiloTabuleiro, { claro: string; escuro: string; moldura: string }> = {
  classico: { claro: "#f0d9b5", escuro: "#b58863", moldura: "#3d2009" },
  neo: { claro: "#dee3e6", escuro: "#8ca2ad", moldura: "#1a2530" },
  madeira: { claro: "#f2d98e", escuro: "#c07c34", moldura: "#5c2e08" },
  marmore: { claro: "#f5f0e8", escuro: "#a8a8a8", moldura: "#444444" },
  azul: { claro: "#dde8f0", escuro: "#4b7399", moldura: "#1a2a3a" },
  verde: { claro: "#ffffdd", escuro: "#86a666", moldura: "#2a3a1a" },
};

const CORES_DALTONICO = { claro: "#ffdd99", escuro: "#5577aa", moldura: "#1a2a4a" };

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
    const cor = modoDaltonico ? "rgba(100, 160, 240, 0.5)" : "rgba(205, 210, 106, 0.6)";
    estilosQuadrados[ultimoLance.origem] = { backgroundColor: cor };
    estilosQuadrados[ultimoLance.destino] = { backgroundColor: cor };
  }

  const setasFormatadas = setas.map((s): [Square, Square, string] => [
    s.origem,
    s.destino,
    s.cor ?? "rgb(0,128,0)",
  ]);

  // Veio de madeira nas casas escuras
  const estiloEscuro: Record<string, string> = {
    backgroundColor: cores.escuro,
    backgroundImage: [
      "repeating-linear-gradient(108deg, transparent 0px, transparent 5px, rgba(0,0,0,0.09) 5px, rgba(0,0,0,0.09) 6px)",
      "repeating-linear-gradient(165deg, transparent 0px, transparent 11px, rgba(255,255,255,0.05) 11px, rgba(255,255,255,0.05) 12px)",
      "linear-gradient(150deg, rgba(255,200,80,0.12) 0%, transparent 35%, rgba(0,0,0,0.15) 100%)",
    ].join(", "),
  };

  // Veio de madeira nas casas claras
  const estiloClaro: Record<string, string> = {
    backgroundColor: cores.claro,
    backgroundImage: [
      "repeating-linear-gradient(108deg, transparent 0px, transparent 6px, rgba(160,90,10,0.09) 6px, rgba(160,90,10,0.09) 7px)",
      "repeating-linear-gradient(165deg, transparent 0px, transparent 13px, rgba(180,110,20,0.06) 13px, rgba(180,110,20,0.06) 14px)",
      "linear-gradient(150deg, rgba(255,255,200,0.5) 0%, transparent 45%, rgba(120,60,0,0.08) 100%)",
    ].join(", "),
  };

  return (
    <div
      className={cn("select-none w-full", className)}
      aria-label="Tabuleiro de xadrez"
      role="img"
    >
      {/* Moldura estilo madeira */}
      <div
        style={{
          backgroundColor: cores.moldura,
          padding: "clamp(10px, 2.5%, 20px)",
          borderRadius: 8,
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 0 2px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.9)",
          backgroundImage: [
            "repeating-linear-gradient(90deg, rgba(255,200,80,0.04) 0px, rgba(255,200,80,0.04) 1px, transparent 1px, transparent 6px)",
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 14px)",
            "linear-gradient(175deg, rgba(255,200,100,0.08) 0%, transparent 40%, rgba(0,0,0,0.18) 100%)",
          ].join(", "),
        }}
      >
        <div ref={containerRef} className="w-full">
          <ChessboardDnDProvider backend={TouchBackend} options={DND_BACKEND_OPTIONS}>
            <Chessboard
              boardWidth={largura}
              position={fen}
              boardOrientation={orientacao}
              arePiecesDraggable={arrastavel}
              customPieces={MAESTRO_PIECES}
              {...(onSquareClick ? { onSquareClick } : {})}
              {...(onPieceDrop ? { onPieceDrop } : {})}
              {...(onPromotionPieceSelect ? { onPromotionPieceSelect } : {})}
              customDarkSquareStyle={estiloEscuro}
              customLightSquareStyle={estiloClaro}
              customSquareStyles={estilosQuadrados}
              customArrows={setasFormatadas}
              animationDuration={prefersReducedMotion ? 0 : 150}
              areArrowsAllowed={false}
              showBoardNotation={true}
            />
          </ChessboardDnDProvider>
        </div>
      </div>
    </div>
  );
}
