import { Chess } from "chess.js";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";

export interface LanceParsed {
  san: string;
  comentario?: string;
  anotacaoTatica: boolean; // [%tac] encontrado no comentário anterior
}

export interface PgnParsed {
  headers: Record<string, string>;
  lances: LanceParsed[];
  resultado: string;
}

export interface PosicaoExtraida {
  fenAntes: string; // posição ANTES do lance tático
  fenDepois: string; // posição APÓS o lance tático
  lance: string; // lance em SAN
  indice: number;
}

export function parsearPgn(pgn: string): Result<PgnParsed, string> {
  try {
    const headers: Record<string, string> = {};
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
    let match: RegExpExecArray | null;

    while ((match = headerRegex.exec(pgn)) !== null) {
      if (match[1] && match[2] !== undefined) {
        headers[match[1]] = match[2];
      }
    }

    // Rejeitar se não há headers de xadrez
    if (!headers["White"] && !headers["Black"] && !headers["Event"]) {
      return err("PGN inválido: sem headers reconhecíveis");
    }

    // Remover headers e limpar
    const movtext = pgn.replace(/\[[^\]]*\]/g, "").trim();

    // Extrair lances e comentários
    const lances: LanceParsed[] = [];
    // Tokeniza: números de movimento, SAN, comentários {...}, variantes (...)
    const tokens =
      movtext.match(
        /\{[^}]*\}|\([^)]*\)|\d+\.+|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|O-O-O|O-O|1-0|0-1|1\/2-1\/2|\*/g,
      ) ?? [];

    let comentarioPendente: string | undefined;
    let resultado = "*";

    for (const token of tokens) {
      if (token.startsWith("{")) {
        comentarioPendente = token.slice(1, -1).trim();
        continue;
      }
      if (token.match(/^\d+\.+$/) || token.match(/^\(/) || token.match(/^\)/)) continue;
      if (token.match(/^(1-0|0-1|1\/2-1\/2|\*)$/)) {
        resultado = token;
        continue;
      }

      const anotacaoTatica = comentarioPendente?.includes("[%tac]") ?? false;
      lances.push({
        san: token,
        ...(comentarioPendente ? { comentario: comentarioPendente } : {}),
        anotacaoTatica,
      });
      comentarioPendente = undefined;
    }

    if (lances.length === 0) {
      return err("PGN inválido: nenhum lance encontrado");
    }

    return ok({ headers, lances, resultado });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao parsear PGN");
  }
}

export function extrairPosicoes(
  parsed: PgnParsed,
  fenInicial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
): PosicaoExtraida[] {
  const posicoes: PosicaoExtraida[] = [];
  const chess = new Chess(fenInicial);

  for (let i = 0; i < parsed.lances.length; i++) {
    const lanceParsed = parsed.lances[i];
    if (!lanceParsed) continue;

    const fenAntes = chess.fen();
    try {
      chess.move(lanceParsed.san);
    } catch {
      break;
    }
    const fenDepois = chess.fen();

    if (lanceParsed.anotacaoTatica) {
      posicoes.push({ fenAntes, fenDepois, lance: lanceParsed.san, indice: i });
    }
  }

  return posicoes;
}
