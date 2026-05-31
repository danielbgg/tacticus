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

const DND_BACKEND_OPTIONS = { enableMouseEvents: true };

// Paletas de cores — sem gradientes sobre as casas, só cor sólida (como Chess.com)
const PALETAS: Record<EstiloTabuleiro, { claro: string; escuro: string; moldura: string }> = {
  // ChessBase marrom — escolhido no board-preview.html
  classico: { claro: "#cda870", escuro: "#905828", moldura: "#1e0800" },
  // lichess / steel blue
  neo: { claro: "#dee3e6", escuro: "#8ca2ad", moldura: "#1a2530" },
  // ChessBase — marfim claro + castanho quente
  madeira: { claro: "#ede0c8", escuro: "#a07850", moldura: "#1e0b00" },
  // marble
  marmore: { claro: "#f5f0e8", escuro: "#a0a098", moldura: "#343434" },
  // ocean
  azul: { claro: "#dde8f0", escuro: "#4b7399", moldura: "#0e1e30" },
  // forest
  verde: { claro: "#ffffdd", escuro: "#86a666", moldura: "#182810" },
};

const PALETA_DALTONICO = { claro: "#ffdd99", escuro: "#5577aa", moldura: "#1a2a4a" };

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

  const pal = modoDaltonico ? PALETA_DALTONICO : (PALETAS[estiloTabuleiro] ?? PALETAS.classico);

  // Casas: cor sólida pura — a textura é aplicada via overlay sobre o tabuleiro inteiro
  const estiloEscuro: Record<string, string> = { backgroundColor: pal.escuro };
  const estiloClaro: Record<string, string> = { backgroundColor: pal.claro };

  // Highlight de último lance sobre a cor base
  const estilosQuadrados: Record<string, React.CSSProperties> = { ...casasDestacadas };
  if (ultimoLance) {
    const cor = modoDaltonico ? "rgba(100,160,240,0.50)" : "rgba(207,210,75,0.55)";
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
      className={cn("select-none w-full", className)}
      aria-label="Tabuleiro de xadrez"
      role="img"
    >
      {/*
        Moldura estilo Chess.com:
        - cor sólida escura (nogueira/chocolate)
        - borda interna clara (reflexo de verniz)
        - sombra profunda para o tabuleiro "flutuar"
        - SEM gradientes CSS complexos que alteram a cor percebida
      */}
      <div
        style={{
          backgroundColor: pal.moldura,
          padding: "clamp(14px, 3.2%, 24px)",
          borderRadius: 8,
          boxShadow: [
            "inset 0 1px 0 rgba(255,255,255,0.12)", // reflexo de verniz no topo
            "inset 0 -1px 0 rgba(0,0,0,0.5)", // sombra interior inferior
            "0 0 0 1px rgba(0,0,0,0.8)", // borda exterior fina
            "0 8px 32px rgba(0,0,0,0.70)", // sombra de profundidade
            "0 2px 6px rgba(0,0,0,0.85)", // sombra próxima
          ].join(", "),
        }}
      >
        {/*
          Posição relativa para o overlay de textura.
          O overlay cobre todo o tabuleiro — cada casa mostra uma região
          diferente da textura SVG, dando variação orgânica entre casas.
        */}
        <div ref={containerRef} className="w-full" style={{ position: "relative" }}>
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

          {/* Overlay de textura de madeira — SVG inline garante renderização do filtro */}
          <svg
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 10,
              mixBlendMode: "multiply" as React.CSSProperties["mixBlendMode"],
            }}
          >
            <defs>
              <filter
                id="woodGrain"
                x="0"
                y="0"
                width="100%"
                height="100%"
                colorInterpolationFilters="sRGB"
              >
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.06 0.018"
                  numOctaves="8"
                  seed="42"
                  result="noise"
                />
                <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
                <feComponentTransfer in="gray">
                  <feFuncR type="linear" slope="0.43" intercept="0.57" />
                  <feFuncG type="linear" slope="0.43" intercept="0.57" />
                  <feFuncB type="linear" slope="0.43" intercept="0.57" />
                </feComponentTransfer>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="white" filter="url(#woodGrain)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
