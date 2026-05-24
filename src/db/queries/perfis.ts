import type { Database } from "better-sqlite3";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { Perfil, NivelJogador } from "@/shared/types/domain";
import { toPerfilId, type PerfilId } from "@/shared/types/branded";
import { randomUUID } from "crypto";

interface CriarPerfilInput {
  nome: string;
  nivel: NivelJogador;
  avatar: string;
  acertosParaDominar: number;
}

interface PerfilRow {
  id: string;
  nome: string;
  nivel: NivelJogador;
  avatar: string;
  acertos_para_dominar: number;
  criado_em: string;
  ultimo_acesso: string;
}

function rowParaPerfil(row: PerfilRow): Perfil {
  return {
    id: toPerfilId(row.id),
    nome: row.nome,
    nivel: row.nivel,
    avatar: row.avatar,
    acertosParaDominar: row.acertos_para_dominar,
    criadoEm: new Date(row.criado_em),
    ultimoAcesso: new Date(row.ultimo_acesso),
  };
}

export async function criarPerfil(
  db: Database,
  input: CriarPerfilInput,
): Promise<Result<Perfil, string>> {
  try {
    const id = randomUUID();
    const agora = new Date().toISOString();
    db.prepare(
      `INSERT INTO perfis (id, nome, nivel, avatar, acertos_para_dominar, criado_em, ultimo_acesso)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, input.nome, input.nivel, input.avatar, input.acertosParaDominar, agora, agora);
    const row = db.prepare("SELECT * FROM perfis WHERE id = ?").get(id) as PerfilRow;
    return ok(rowParaPerfil(row));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao criar perfil");
  }
}

export async function listarPerfis(db: Database): Promise<Result<Perfil[], string>> {
  try {
    const rows = db
      .prepare("SELECT * FROM perfis ORDER BY ultimo_acesso DESC")
      .all() as PerfilRow[];
    return ok(rows.map(rowParaPerfil));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar perfis");
  }
}

export async function buscarPerfil(
  db: Database,
  id: PerfilId,
): Promise<Result<Perfil | null, string>> {
  try {
    const row = db.prepare("SELECT * FROM perfis WHERE id = ?").get(id) as PerfilRow | undefined;
    return ok(row ? rowParaPerfil(row) : null);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar perfil");
  }
}

export async function atualizarUltimoAcesso(
  db: Database,
  id: PerfilId,
): Promise<Result<void, string>> {
  try {
    db.prepare("UPDATE perfis SET ultimo_acesso = ? WHERE id = ?").run(
      new Date().toISOString(),
      id,
    );
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao atualizar último acesso");
  }
}

export async function excluirPerfil(db: Database, id: PerfilId): Promise<Result<void, string>> {
  try {
    db.prepare("DELETE FROM perfis WHERE id = ?").run(id);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao excluir perfil");
  }
}
