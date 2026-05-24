import type Database from "@tauri-apps/plugin-sql";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { Sessao, ModoSessao } from "@/shared/types/domain";
import { toSessaoId, toPerfilId, type SessaoId, type PerfilId } from "@/shared/types/branded";

interface SessaoRow {
  id: string;
  perfil_id: string;
  inicio: string;
  fim: string | null;
  total_tentativas: number;
  total_acertos: number;
  modo: ModoSessao;
}

function rowParaSessao(row: SessaoRow): Sessao {
  return {
    id: toSessaoId(row.id),
    perfilId: toPerfilId(row.perfil_id),
    inicio: new Date(row.inicio),
    ...(row.fim ? { fim: new Date(row.fim) } : {}),
    totalTentativas: row.total_tentativas,
    totalAcertos: row.total_acertos,
    modo: row.modo,
  };
}

export async function criarSessao(
  db: Database,
  input: { perfilId: PerfilId; modo: ModoSessao },
): Promise<Result<Sessao, string>> {
  try {
    const id = crypto.randomUUID();
    const inicio = new Date().toISOString();
    await db.execute(
      `INSERT INTO sessoes (id, perfil_id, inicio, total_tentativas, total_acertos, modo)
       VALUES (?, ?, ?, 0, 0, ?)`,
      [id, input.perfilId, inicio, input.modo],
    );
    const rows = await db.select<SessaoRow[]>("SELECT * FROM sessoes WHERE id = ?", [id]);
    const row = rows[0];
    if (!row) throw new Error("Sessão não encontrada após criação");
    return ok(rowParaSessao(row));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao criar sessão");
  }
}

export async function encerrarSessao(
  db: Database,
  sessaoId: SessaoId,
  totais: { totalTentativas: number; totalAcertos: number },
): Promise<Result<void, string>> {
  try {
    await db.execute(
      `UPDATE sessoes SET fim = ?, total_tentativas = ?, total_acertos = ? WHERE id = ?`,
      [new Date().toISOString(), totais.totalTentativas, totais.totalAcertos, sessaoId],
    );
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao encerrar sessão");
  }
}

export async function listarSessoesPerfil(
  db: Database,
  perfilId: PerfilId,
  limite = 50,
): Promise<Result<Sessao[], string>> {
  try {
    const rows = await db.select<SessaoRow[]>(
      "SELECT * FROM sessoes WHERE perfil_id = ? ORDER BY inicio DESC LIMIT ?",
      [perfilId, limite],
    );
    return ok(rows.map(rowParaSessao));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar sessões");
  }
}

export async function buscarSessao(
  db: Database,
  sessaoId: SessaoId,
): Promise<Result<Sessao | null, string>> {
  try {
    const rows = await db.select<SessaoRow[]>("SELECT * FROM sessoes WHERE id = ?", [sessaoId]);
    const row = rows[0];
    return ok(row ? rowParaSessao(row) : null);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar sessão");
  }
}
