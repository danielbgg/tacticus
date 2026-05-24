import type { ReactElement } from "react";

type PieceProps = { squareWidth: number; isDragging?: boolean };
type PieceFn = (props: PieceProps) => ReactElement;

function makePiece(src: string): PieceFn {
  return ({ squareWidth }) => (
    <img
      src={src}
      width={squareWidth}
      height={squareWidth}
      draggable={false}
      style={{ userSelect: "none", pointerEvents: "none" }}
    />
  );
}

export const MAESTRO_PIECES: Record<string, PieceFn> = {
  wK: makePiece("/pieces/maestro/wK.svg"),
  wQ: makePiece("/pieces/maestro/wQ.svg"),
  wR: makePiece("/pieces/maestro/wR.svg"),
  wB: makePiece("/pieces/maestro/wB.svg"),
  wN: makePiece("/pieces/maestro/wN.svg"),
  wP: makePiece("/pieces/maestro/wP.svg"),
  bK: makePiece("/pieces/maestro/bK.svg"),
  bQ: makePiece("/pieces/maestro/bQ.svg"),
  bR: makePiece("/pieces/maestro/bR.svg"),
  bB: makePiece("/pieces/maestro/bB.svg"),
  bN: makePiece("/pieces/maestro/bN.svg"),
  bP: makePiece("/pieces/maestro/bP.svg"),
};
