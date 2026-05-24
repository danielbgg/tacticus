import type Database from "@tauri-apps/plugin-sql";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { Exercicio } from "@/shared/types/domain";
import type { PerfilId, SessaoId, UnidadeId } from "@/shared/types/branded";
import { toSessaoId } from "@/shared/types/branded";

export interface SessaoPausada {
  perfilId: PerfilId;
  unidadeId: UnidadeId;
  sessaoId: SessaoId;
  fila: Exercicio[];
  pausadaEm: Date;
}

interface SessaoPausadaRow {
  perfil_id: string;
  unidade_id: string;
  sessao_id: string;
  fila_json: string;
  pausada_em: string;
}

function rowParaSessaoPausada(row: SessaoPausadaRow): SessaoPausada {
  return {
    perfilId: row.perfil_id as PerfilId,
    unidadeId: row.unidade_id as UnidadeId,
    sessaoId: toSessaoId(row.sessao_id),
    fila: JSON.parse(row.fila_json) as Exercicio[],
    pausadaEm: new Date(row.pausada_em),
  };
}

export async function salvarSessaoPausada(
  db: Database,
  input: {
    perfilId: PerfilId;
    unidadeId: UnidadeId;
    sessaoId: SessaoId;
    fila: Exercicio[];
  },
): Promise<Result<void, string>> {
  try {
    await db.execute(
      `INSERT INTO sessoes_pausadas (perfil_id, unidade_id, sessao_id, fila_json, pausada_em)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(perfil_id, unidade_id) DO UPDATE SET
         sessao_id = excluded.sessao_id,
         fila_json = excluded.fila_json,
         pausada_em = excluded.pausada_em`,
      [
        input.perfilId,
        input.unidadeId,
        input.sessaoId,
        JSON.stringify(input.fila),
        new Date().toISOString(),
      ],
    );
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao salvar sessão pausada");
  }
}

export async function buscarSessaoPausada(
  db: Database,
  perfilId: PerfilId,
  unidadeId: UnidadeId,
): Promise<Result<SessaoPausada | null, string>> {
  try {
    const rows = await db.select<SessaoPausadaRow[]>(
      "SELECT * FROM sessoes_pausadas WHERE perfil_id = ? AND unidade_id = ?",
      [perfilId, unidadeId],
    );
    const row = rows[0];
    return ok(row ? rowParaSessaoPausada(row) : null);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar sessão pausada");
  }
}

export async function removerSessaoPausada(
  db: Database,
  perfilId: PerfilId,
  unidadeId: UnidadeId,
): Promise<Result<void, string>> {
  try {
    await db.execute("DELETE FROM sessoes_pausadas WHERE perfil_id = ? AND unidade_id = ?", [
      perfilId,
      unidadeId,
    ]);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao remover sessão pausada");
  }
}
