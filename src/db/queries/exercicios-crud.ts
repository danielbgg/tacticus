import type { Database } from "better-sqlite3";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { Exercicio } from "@/shared/types/domain";
import {
  toExercicioId,
  toPartidaId,
  type ExercicioId,
  type UnidadeId,
  type PartidaId,
} from "@/shared/types/branded";
import { randomUUID } from "crypto";

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

function criarPartidaPlaceholder(db: Database): void {
  const existe = db.prepare("SELECT id FROM partidas WHERE id = 'placeholder'").get();
  if (!existe) {
    db.prepare(
      "INSERT INTO partidas (id, brancas, negras) VALUES ('placeholder', 'Personalizado', 'Personalizado')",
    ).run();
  }
}

export async function criarExercicioCustomizado(
  db: Database,
  input: CriarExercicioInput,
): Promise<Result<{ id: ExercicioId }, string>> {
  try {
    criarPartidaPlaceholder(db);
    const id = randomUUID();
    db.prepare(
      `INSERT INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.unidadeId,
      input.partidaId ?? PARTIDA_PLACEHOLDER,
      input.fenInicial,
      JSON.stringify(input.lancesSolucao),
      input.fenFinal ?? null,
      input.descricao ?? null,
      input.ordem,
    );
    // Marcar como customizado via UPDATE (a coluna não existe no schema atual — adicionamos)
    // Para compatibilidade, usamos uma tabela auxiliar de metadata
    try {
      db.prepare(
        "INSERT OR IGNORE INTO exercicios_meta (exercicio_id, banco_customizado) VALUES (?, 1)",
      ).run(id);
    } catch {
      db.exec(
        "CREATE TABLE IF NOT EXISTS exercicios_meta (exercicio_id TEXT PRIMARY KEY, banco_customizado INTEGER NOT NULL DEFAULT 0)",
      );
      db.prepare(
        "INSERT OR IGNORE INTO exercicios_meta (exercicio_id, banco_customizado) VALUES (?, 1)",
      ).run(id);
    }
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
    db.prepare(`UPDATE exercicios SET ${campos.join(", ")} WHERE id = ?`).run(
      ...(valores as Parameters<ReturnType<Database["prepare"]>["run"]>),
    );
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
    // Verificar se é customizado
    db.exec(
      "CREATE TABLE IF NOT EXISTS exercicios_meta (exercicio_id TEXT PRIMARY KEY, banco_customizado INTEGER NOT NULL DEFAULT 0)",
    );
    const meta = db
      .prepare("SELECT banco_customizado FROM exercicios_meta WHERE exercicio_id = ?")
      .get(id) as { banco_customizado: number } | undefined;

    if (!meta || meta.banco_customizado !== 1) {
      return err("Não é possível excluir exercícios do banco padrão");
    }

    db.prepare("DELETE FROM exercicios WHERE id = ?").run(id);
    db.prepare("DELETE FROM exercicios_meta WHERE exercicio_id = ?").run(id);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao excluir exercício");
  }
}
