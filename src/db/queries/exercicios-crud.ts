import type Database from "@tauri-apps/plugin-sql";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import {
  toExercicioId,
  toPartidaId,
  type ExercicioId,
  type UnidadeId,
  type PartidaId,
} from "@/shared/types/branded";

interface CriarExercicioInput {
  unidadeId: UnidadeId;
  partidaId?: PartidaId;
  fenInicial: string;
  lancesSolucao: string[];
  fenFinal?: string;
  descricao?: string;
  ordem: number;
}

type AtualizarExercicioInput = Partial<
  Pick<CriarExercicioInput, "lancesSolucao" | "fenInicial" | "descricao" | "ordem">
>;

const PARTIDA_PLACEHOLDER = toPartidaId("placeholder");

async function garantirPartidaPlaceholder(db: Database): Promise<void> {
  await db.execute(
    `INSERT OR IGNORE INTO partidas (id, brancas, negras) VALUES ('placeholder', 'Personalizado', 'Personalizado')`,
  );
}

async function garantirTabelaMeta(db: Database): Promise<void> {
  await db.execute(
    `CREATE TABLE IF NOT EXISTS exercicios_meta (exercicio_id TEXT PRIMARY KEY, banco_customizado INTEGER NOT NULL DEFAULT 0)`,
  );
}

export async function criarExercicioCustomizado(
  db: Database,
  input: CriarExercicioInput,
): Promise<Result<{ id: ExercicioId }, string>> {
  try {
    await garantirPartidaPlaceholder(db);
    await garantirTabelaMeta(db);
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.unidadeId,
        input.partidaId ?? PARTIDA_PLACEHOLDER,
        input.fenInicial,
        JSON.stringify(input.lancesSolucao),
        input.fenFinal ?? null,
        input.descricao ?? null,
        input.ordem,
      ],
    );
    await db.execute(
      `INSERT OR IGNORE INTO exercicios_meta (exercicio_id, banco_customizado) VALUES (?, 1)`,
      [id],
    );
    return ok({ id: toExercicioId(id) });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao criar exercício");
  }
}

export async function atualizarExercicio(
  db: Database,
  id: ExercicioId,
  updates: AtualizarExercicioInput,
): Promise<Result<void, string>> {
  try {
    const campos: string[] = [];
    const valores: unknown[] = [];

    if (updates.lancesSolucao !== undefined) {
      campos.push("lances_solucao = ?");
      valores.push(JSON.stringify(updates.lancesSolucao));
    }
    if (updates.fenInicial !== undefined) {
      campos.push("fen_inicial = ?");
      valores.push(updates.fenInicial);
    }
    if (updates.descricao !== undefined) {
      campos.push("descricao = ?");
      valores.push(updates.descricao);
    }
    if (updates.ordem !== undefined) {
      campos.push("ordem = ?");
      valores.push(updates.ordem);
    }

    if (campos.length === 0) return ok(undefined);

    valores.push(id);
    await db.execute(`UPDATE exercicios SET ${campos.join(", ")} WHERE id = ?`, valores);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao atualizar exercício");
  }
}

export async function excluirExercicio(
  db: Database,
  id: ExercicioId,
): Promise<Result<void, string>> {
  try {
    await garantirTabelaMeta(db);
    const rows = await db.select<Array<{ banco_customizado: number }>>(
      `SELECT banco_customizado FROM exercicios_meta WHERE exercicio_id = ?`,
      [id],
    );
    const meta = rows[0];
    if (!meta || meta.banco_customizado !== 1) {
      return err("Não é possível excluir exercícios do banco padrão");
    }
    await db.execute("DELETE FROM exercicios WHERE id = ?", [id]);
    await db.execute("DELETE FROM exercicios_meta WHERE exercicio_id = ?", [id]);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao excluir exercício");
  }
}
