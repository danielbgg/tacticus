import type Database from "@tauri-apps/plugin-sql";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { Exercicio, Partida } from "@/shared/types/domain";
import {
  toExercicioId,
  toUnidadeId,
  toPartidaId,
  type ExercicioId,
  type UnidadeId,
} from "@/shared/types/branded";

interface ExercicioRow {
  id: string;
  unidade_id: string;
  partida_id: string;
  fen_inicial: string;
  lances_solucao: string;
  fen_final: string | null;
  descricao: string | null;
  ordem: number;
  temas: string | null;
}

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

function rowParaExercicio(row: ExercicioRow, partida: Partida): Exercicio {
  const ratingMatch = row.descricao ? /\((\d+)\)$/.exec(row.descricao) : null;
  return {
    id: toExercicioId(row.id),
    unidadeId: toUnidadeId(row.unidade_id),
    partida,
    fen: row.fen_inicial,
    fenInicial: row.fen_inicial,
    tipo: "tatica",
    lancesSolucao: JSON.parse(row.lances_solucao) as string[],
    ...(row.fen_final ? { fenFinal: row.fen_final } : {}),
    ...(row.descricao ? { descricao: row.descricao } : {}),
    ...(row.temas ? { temas: row.temas.trim().split(" ") } : {}),
    ...(ratingMatch ? { rating: parseInt(ratingMatch[1]!) } : {}),
    ordem: row.ordem,
  };
}

type JoinRow = ExercicioRow & {
  p_id: string | null;
  p_brancas: string | null;
  p_negras: string | null;
  p_elo_brancas: number | null;
  p_elo_negras: number | null;
  p_evento: string | null;
  p_ano: number | null;
  p_resultado: string | null;
  p_eco: string | null;
  p_pgn: string | null;
};

function joinRowParaExercicio(r: JoinRow): Exercicio {
  const partida = rowParaPartida({
    id: r.p_id ?? r.id,
    brancas: r.p_brancas,
    negras: r.p_negras,
    elo_brancas: r.p_elo_brancas,
    elo_negras: r.p_elo_negras,
    evento: r.p_evento,
    ano: r.p_ano,
    resultado: r.p_resultado,
    eco: r.p_eco,
    pgn: r.p_pgn,
  });
  return rowParaExercicio(r, partida);
}

const JOIN_SQL = `
  SELECT e.id, e.unidade_id, e.partida_id, e.fen_inicial, e.lances_solucao, e.fen_final, e.descricao, e.ordem, e.temas,
         p.id as p_id, p.brancas as p_brancas, p.negras as p_negras,
         p.elo_brancas as p_elo_brancas, p.elo_negras as p_elo_negras,
         p.evento as p_evento, p.ano as p_ano, p.resultado as p_resultado,
         p.eco as p_eco, p.pgn as p_pgn
  FROM exercicios e
  LEFT JOIN partidas p ON e.partida_id = p.id`;

export async function listarExercicios(db: Database): Promise<Result<Exercicio[], string>> {
  try {
    const rows = await db.select<JoinRow[]>(`${JOIN_SQL} ORDER BY e.ordem`);
    return ok(rows.map(joinRowParaExercicio));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar exercícios");
  }
}

export async function listarExerciciosDaUnidade(
  db: Database,
  unidadeId: UnidadeId,
): Promise<Result<Exercicio[], string>> {
  try {
    const rows = await db.select<JoinRow[]>(`${JOIN_SQL} WHERE e.unidade_id = ? ORDER BY e.ordem`, [
      unidadeId,
    ]);
    return ok(rows.map(joinRowParaExercicio));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar exercícios da unidade");
  }
}

export async function buscarExercicio(
  db: Database,
  id: ExercicioId,
): Promise<Result<Exercicio | null, string>> {
  try {
    const rows = await db.select<JoinRow[]>(`${JOIN_SQL} WHERE e.id = ?`, [id]);
    const row = rows[0];
    if (!row) return ok(null);
    return ok(joinRowParaExercicio(row));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar exercício");
  }
}

export async function buscarExerciciosPorIds(
  db: Database,
  ids: string[],
): Promise<Result<Exercicio[], string>> {
  if (ids.length === 0) return ok([]);
  try {
    const placeholders = ids.map(() => "?").join(", ");
    const rows = await db.select<JoinRow[]>(
      `${JOIN_SQL} WHERE e.id IN (${placeholders}) ORDER BY e.ordem`,
      ids,
    );
    return ok(rows.map(joinRowParaExercicio));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar exercícios por ids");
  }
}
