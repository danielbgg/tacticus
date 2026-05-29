import type Database from "@tauri-apps/plugin-sql";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { Perfil, NivelJogador } from "@/shared/types/domain";
import { toPerfilId, type PerfilId } from "@/shared/types/branded";

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
    const id = crypto.randomUUID();
    const agora = new Date().toISOString();
    await db.execute(
      `INSERT INTO perfis (id, nome, nivel, avatar, acertos_para_dominar, criado_em, ultimo_acesso)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, input.nome, input.nivel, input.avatar, input.acertosParaDominar, agora, agora],
    );
    const rows = await db.select<PerfilRow[]>("SELECT * FROM perfis WHERE id = ?", [id]);
    const row = rows[0];
    if (!row) throw new Error("Perfil não encontrado após criação");
    return ok(rowParaPerfil(row));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao criar perfil");
  }
}

export async function listarPerfis(db: Database): Promise<Result<Perfil[], string>> {
  try {
    const rows = await db.select<PerfilRow[]>("SELECT * FROM perfis ORDER BY ultimo_acesso DESC");
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
    const rows = await db.select<PerfilRow[]>("SELECT * FROM perfis WHERE id = ?", [id]);
    const row = rows[0];
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
    await db.execute("UPDATE perfis SET ultimo_acesso = ? WHERE id = ?", [
      new Date().toISOString(),
      id,
    ]);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao atualizar último acesso");
  }
}

export async function excluirPerfil(db: Database, id: PerfilId): Promise<Result<void, string>> {
  try {
    await db.execute("DELETE FROM perfis WHERE id = ?", [id]);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao excluir perfil");
  }
}

export async function renomearPerfil(
  db: Database,
  id: PerfilId,
  novoNome: string,
): Promise<Result<void, string>> {
  try {
    await db.execute("UPDATE perfis SET nome = ? WHERE id = ?", [novoNome, id]);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao renomear perfil");
  }
}
