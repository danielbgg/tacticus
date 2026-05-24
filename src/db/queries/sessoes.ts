import type { Database } from "better-sqlite3";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { Sessao, ModoSessao } from "@/shared/types/domain";
import { toSessaoId, toPerfilId, type SessaoId, type PerfilId } from "@/shared/types/branded";
import { randomUUID } from "crypto";

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
    const id = randomUUID();
    const inicio = new Date().toISOString();
    db.prepare(
      `INSERT INTO sessoes (id, perfil_id, inicio, total_tentativas, total_acertos, modo)
       VALUES (?, ?, ?, 0, 0, ?)`,
    ).run(id, input.perfilId, inicio, input.modo);
    const row = db.prepare("SELECT * FROM sessoes WHERE id = ?").get(id) as SessaoRow;
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
    db.prepare(
      `UPDATE sessoes SET fim = ?, total_tentativas = ?, total_acertos = ? WHERE id = ?`,
    ).run(new Date().toISOString(), totais.totalTentativas, totais.totalAcertos, sessaoId);
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
    const rows = db
      .prepare("SELECT * FROM sessoes WHERE perfil_id = ? ORDER BY inicio DESC LIMIT ?")
      .all(perfilId, limite) as SessaoRow[];
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
    const row = db.prepare("SELECT * FROM sessoes WHERE id = ?").get(sessaoId) as
      | SessaoRow
      | undefined;
    return ok(row ? rowParaSessao(row) : null);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar sessão");
  }
}
