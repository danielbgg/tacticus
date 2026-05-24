import type { Database } from "better-sqlite3";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { Tentativa } from "@/shared/types/domain";
import {
  toTentativaId,
  toSessaoId,
  toPerfilId,
  toExercicioId,
  type SessaoId,
  type PerfilId,
  type ExercicioId,
} from "@/shared/types/branded";
import { randomUUID } from "crypto";

interface TentativaRow {
  id: string;
  sessao_id: string;
  perfil_id: string;
  exercicio_id: string;
  timestamp: string;
  acertou: number;
  tempo_resposta_ms: number;
  dicas_usadas: 0 | 1 | 2 | 3;
}

interface RegistrarTentativaInput {
  sessaoId: SessaoId;
  perfilId: PerfilId;
  exercicioId: ExercicioId;
  acertou: boolean;
  tempoRespostaMs: number;
  dicasUsadas: 0 | 1 | 2 | 3;
}

function rowParaTentativa(row: TentativaRow): Tentativa {
  return {
    id: toTentativaId(row.id),
    sessaoId: toSessaoId(row.sessao_id),
    perfilId: toPerfilId(row.perfil_id),
    exercicioId: toExercicioId(row.exercicio_id),
    timestamp: new Date(row.timestamp),
    acertou: Boolean(row.acertou),
    tempoRespostaMs: row.tempo_resposta_ms,
    dicasUsadas: row.dicas_usadas,
  };
}

export async function registrarTentativa(
  db: Database,
  input: RegistrarTentativaInput,
): Promise<Result<Tentativa, string>> {
  try {
    const id = randomUUID();
    const timestamp = new Date().toISOString();
    db.prepare(
      `INSERT INTO tentativas (id, sessao_id, perfil_id, exercicio_id, timestamp, acertou, tempo_resposta_ms, dicas_usadas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.sessaoId,
      input.perfilId,
      input.exercicioId,
      timestamp,
      input.acertou ? 1 : 0,
      input.tempoRespostaMs,
      input.dicasUsadas,
    );
    const row = db.prepare("SELECT * FROM tentativas WHERE id = ?").get(id) as TentativaRow;
    return ok(rowParaTentativa(row));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao registrar tentativa");
  }
}

export async function listarTentativasSessao(
  db: Database,
  sessaoId: SessaoId,
): Promise<Result<Tentativa[], string>> {
  try {
    const rows = db
      .prepare("SELECT * FROM tentativas WHERE sessao_id = ? ORDER BY timestamp ASC")
      .all(sessaoId) as TentativaRow[];
    return ok(rows.map(rowParaTentativa));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar tentativas");
  }
}
