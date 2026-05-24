import type Database from "@tauri-apps/plugin-sql";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { Partida } from "@/shared/types/domain";
import { toPartidaId, type PartidaId } from "@/shared/types/branded";

interface PartidaRow {
  id: string;
  brancas: string | null;
  negras: string | null;
  elo_brancas: number | null;
  elo_negras: number | null;
  evento: string | null;
  ano: number | null;
  resultado: string | null;
  eco: string | null;
  pgn: string | null;
}

function rowParaPartida(row: PartidaRow): Partida {
  return {
    id: toPartidaId(row.id),
    brancas: row.brancas ?? "Desconhecido",
    negras: row.negras ?? "Desconhecido",
    ...(row.elo_brancas != null ? { eloBrancas: row.elo_brancas } : {}),
    ...(row.elo_negras != null ? { eloNegras: row.elo_negras } : {}),
    ...(row.evento ? { evento: row.evento } : {}),
    ...(row.ano != null ? { ano: row.ano } : {}),
    ...(row.resultado ? { resultado: row.resultado as NonNullable<Partida["resultado"]> } : {}),
    ...(row.eco ? { eco: row.eco } : {}),
    ...(row.pgn ? { pgn: row.pgn } : {}),
  };
}

export async function buscarPartida(
  db: Database,
  id: PartidaId,
): Promise<Result<Partida | null, string>> {
  try {
    const rows = await db.select<PartidaRow[]>("SELECT * FROM partidas WHERE id = ?", [id]);
    const row = rows[0];
    return ok(row ? rowParaPartida(row) : null);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar partida");
  }
}

interface FiltroPartidas {
  jogador?: string;
  eco?: string;
  anoMin?: number;
  anoMax?: number;
  limite?: number;
}

export async function buscarPartidasFiltradas(
  db: Database,
  filtro: FiltroPartidas,
): Promise<Result<Partida[], string>> {
  try {
    const condicoes: string[] = [];
    const params: (string | number)[] = [];

    if (filtro.jogador) {
      condicoes.push("(brancas LIKE ? OR negras LIKE ?)");
      params.push(`%${filtro.jogador}%`, `%${filtro.jogador}%`);
    }
    if (filtro.eco) {
      condicoes.push("eco LIKE ?");
      params.push(`${filtro.eco}%`);
    }
    if (filtro.anoMin !== undefined) {
      condicoes.push("ano >= ?");
      params.push(filtro.anoMin);
    }
    if (filtro.anoMax !== undefined) {
      condicoes.push("ano <= ?");
      params.push(filtro.anoMax);
    }

    const where = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";
    const limite = filtro.limite ?? 100;
    params.push(limite);
    const rows = await db.select<PartidaRow[]>(
      `SELECT * FROM partidas ${where} ORDER BY ano DESC LIMIT ?`,
      params,
    );
    return ok(rows.map(rowParaPartida));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao filtrar partidas");
  }
}
