import type Database from "@tauri-apps/plugin-sql";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { Area, Modulo, Unidade } from "@/shared/types/domain";
import { toAreaId, toModuloId, toUnidadeId } from "@/shared/types/branded";

interface AreaRow {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
}
interface ModuloRow {
  id: string;
  area_id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
}
interface UnidadeRow {
  id: string;
  modulo_id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  total_exercicios: number;
}

export async function listarAreas(db: Database): Promise<Result<Area[], string>> {
  try {
    const rows = await db.select<AreaRow[]>("SELECT * FROM areas ORDER BY ordem");
    return ok(
      rows.map((r) => ({
        id: toAreaId(r.id),
        nome: r.nome,
        ...(r.descricao != null ? { descricao: r.descricao } : {}),
        ordem: r.ordem,
      })),
    );
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar áreas");
  }
}

export async function listarModulosArea(
  db: Database,
  areaId: string,
): Promise<Result<Modulo[], string>> {
  try {
    const rows = await db.select<ModuloRow[]>(
      "SELECT * FROM modulos WHERE area_id = ? ORDER BY ordem",
      [areaId],
    );
    return ok(
      rows.map((r) => ({
        id: toModuloId(r.id),
        areaId: toAreaId(r.area_id),
        nome: r.nome,
        ...(r.descricao != null ? { descricao: r.descricao } : {}),
        ordem: r.ordem,
      })),
    );
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar módulos");
  }
}

export interface UnidadeComModulo {
  unidadeId: string;
  unidadeNome: string;
  unidadeOrdem: number;
  moduloId: string;
  moduloNome: string;
  moduloOrdem: number;
}

export async function buscarUnidadeComModulo(
  db: Database,
  unidadeId: string,
): Promise<Result<UnidadeComModulo | null, string>> {
  try {
    const rows = await db.select<
      Array<{
        u_id: string;
        u_nome: string;
        u_ordem: number;
        m_id: string;
        m_nome: string;
        m_ordem: number;
      }>
    >(
      `SELECT u.id as u_id, u.nome as u_nome, u.ordem as u_ordem,
              m.id as m_id, m.nome as m_nome, m.ordem as m_ordem
       FROM unidades u
       JOIN modulos m ON m.id = u.modulo_id
       WHERE u.id = ?`,
      [unidadeId],
    );
    const r = rows[0];
    if (!r) return ok(null);
    return ok({
      unidadeId: r.u_id,
      unidadeNome: r.u_nome,
      unidadeOrdem: r.u_ordem,
      moduloId: r.m_id,
      moduloNome: r.m_nome,
      moduloOrdem: r.m_ordem,
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar unidade");
  }
}

export async function listarUnidadesModulo(
  db: Database,
  moduloId: string,
): Promise<Result<Unidade[], string>> {
  try {
    const rows = await db.select<UnidadeRow[]>(
      `SELECT u.*, COUNT(e.id) as total_exercicios
       FROM unidades u
       LEFT JOIN exercicios e ON e.unidade_id = u.id
       WHERE u.modulo_id = ?
       GROUP BY u.id
       ORDER BY u.ordem`,
      [moduloId],
    );
    return ok(
      rows.map((r) => ({
        id: toUnidadeId(r.id),
        moduloId: toModuloId(r.modulo_id),
        nome: r.nome,
        ...(r.descricao != null ? { descricao: r.descricao } : {}),
        ordem: r.ordem,
        totalExercicios: r.total_exercicios,
      })),
    );
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar unidades");
  }
}
