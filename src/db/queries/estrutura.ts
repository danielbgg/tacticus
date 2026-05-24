import type { Database } from "better-sqlite3";
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
    const rows = db.prepare("SELECT * FROM areas ORDER BY ordem").all() as AreaRow[];
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
    const rows = db
      .prepare("SELECT * FROM modulos WHERE area_id = ? ORDER BY ordem")
      .all(areaId) as ModuloRow[];
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

export async function listarUnidadesModulo(
  db: Database,
  moduloId: string,
): Promise<Result<Unidade[], string>> {
  try {
    const rows = db
      .prepare(
        `SELECT u.*, COUNT(e.id) as total_exercicios
       FROM unidades u
       LEFT JOIN exercicios e ON e.unidade_id = u.id
       WHERE u.modulo_id = ?
       GROUP BY u.id
       ORDER BY u.ordem`,
      )
      .all(moduloId) as UnidadeRow[];

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
