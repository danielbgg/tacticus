import { Chess } from "chess.js";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";

export function validarFen(fen: string): Result<string, string> {
  try {
    new Chess(fen);
    return ok(fen);
  } catch {
    return err(`FEN inválido: ${fen}`);
  }
}

export function uciParaSan(fen: string, uci: string): Result<string, string> {
  try {
    const chess = new Chess(fen);
    const origem = uci.slice(0, 2);
    const destino = uci.slice(2, 4);
    const promocao = uci.length === 5 ? uci[4] : undefined;
    const resultado = chess.move({
      from: origem,
      to: destino,
      ...(promocao ? { promotion: promocao } : {}),
    });
    if (!resultado) return err(`Lance UCI inválido: ${uci}`);
    return ok(resultado.san);
  } catch {
    return err(`Erro ao converter UCI para SAN: ${uci}`);
  }
}

export function sanParaUci(fen: string, san: string): Result<string, string> {
  try {
    const chess = new Chess(fen);
    const resultado = chess.move(san);
    if (!resultado) return err(`Lance SAN inválido: ${san}`);
    const uci = resultado.from + resultado.to + (resultado.promotion ?? "");
    return ok(uci);
  } catch {
    return err(`Erro ao converter SAN para UCI: ${san}`);
  }
}

export function fenAposLances(fen: string, lances: string[]): Result<string, string> {
  try {
    const chess = new Chess(fen);
    for (const lance of lances) {
      const resultado = chess.move(lance);
      if (!resultado) return err(`Lance inválido na sequência: ${lance}`);
    }
    return ok(chess.fen());
  } catch {
    return err("Erro ao aplicar sequência de lances");
  }
}

export function extrairInfoPosicao(
  fen: string,
): Result<{ turno: "w" | "b"; xequeMate: boolean; afogamento: boolean; xeque: boolean }, string> {
  try {
    const chess = new Chess(fen);
    return ok({
      turno: chess.turn(),
      xequeMate: chess.isCheckmate(),
      afogamento: chess.isStalemate(),
      xeque: chess.inCheck(),
    });
  } catch {
    return err(`FEN inválido: ${fen}`);
  }
}

export function lancesLegais(fen: string): Result<string[], string> {
  try {
    const chess = new Chess(fen);
    return ok(chess.moves());
  } catch {
    return err(`FEN inválido: ${fen}`);
  }
}
