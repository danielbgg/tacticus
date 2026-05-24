import type { Database } from "better-sqlite3";
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
    ordem: row.ordem,
  };
}

export async function listarExercicios(db: Database): Promise<Result<Exercicio[], string>> {
  try {
    const rows = db
      .prepare(
        `SELECT e.*, p.id as p_id, p.brancas, p.negras, p.elo_brancas, p.elo_negras,
                p.evento, p.ano, p.resultado, p.eco, p.pgn
         FROM exercicios e
         LEFT JOIN partidas p ON e.partida_id = p.id
         ORDER BY e.ordem`,
      )
      .all() as (ExercicioRow & PartidaRow & { p_id: string })[];

    return ok(rows.map((r) => rowParaExercicio(r, rowParaPartida({ ...r, id: r.p_id }))));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar exercícios");
  }
}

export async function listarExerciciosDaUnidade(
  db: Database,
  unidadeId: UnidadeId,
): Promise<Result<Exercicio[], string>> {
  try {
    const rows = db
      .prepare(
        `SELECT e.*, p.id as p_id, p.brancas, p.negras, p.elo_brancas, p.elo_negras,
                p.evento, p.ano, p.resultado, p.eco, p.pgn
         FROM exercicios e
         LEFT JOIN partidas p ON e.partida_id = p.id
         WHERE e.unidade_id = ?
         ORDER BY e.ordem`,
      )
      .all(unidadeId) as (ExercicioRow & PartidaRow & { p_id: string })[];

    return ok(rows.map((r) => rowParaExercicio(r, rowParaPartida({ ...r, id: r.p_id }))));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar exercícios da unidade");
  }
}

export async function buscarExercicio(
  db: Database,
  id: ExercicioId,
): Promise<Result<Exercicio | null, string>> {
  try {
    const row = db
      .prepare(
        `SELECT e.*, p.id as p_id, p.brancas, p.negras, p.elo_brancas, p.elo_negras,
                p.evento, p.ano, p.resultado, p.eco, p.pgn
         FROM exercicios e
         LEFT JOIN partidas p ON e.partida_id = p.id
         WHERE e.id = ?`,
      )
      .get(id) as (ExercicioRow & PartidaRow & { p_id: string }) | undefined;

    if (!row) return ok(null);
    return ok(rowParaExercicio(row, rowParaPartida({ ...row, id: row.p_id })));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar exercício");
  }
}
