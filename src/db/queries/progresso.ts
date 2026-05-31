import type Database from "@tauri-apps/plugin-sql";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { ProgressoExercicio, StatusExercicio } from "@/shared/types/domain";
import { toExercicioId, toPerfilId, type ExercicioId, type PerfilId } from "@/shared/types/branded";

interface ProgressoRow {
  perfil_id: string;
  exercicio_id: string;
  status: StatusExercicio;
  acertos_consecutivos: number;
  total_acertos: number;
  total_tentativas: number;
  fator_facilidade: number;
  intervalo_dias: number;
  proxima_revisao: string | null;
  ultima_tentativa: string | null;
  favoritado: number;
}

function rowParaProgresso(row: ProgressoRow): ProgressoExercicio {
  return {
    perfilId: toPerfilId(row.perfil_id),
    exercicioId: toExercicioId(row.exercicio_id),
    status: row.status,
    acertosConsecutivos: row.acertos_consecutivos,
    totalAcertos: row.total_acertos,
    totalTentativas: row.total_tentativas,
    fatorFacilidade: row.fator_facilidade,
    intervaloDias: row.intervalo_dias,
    proximaRevisao: row.proxima_revisao ? new Date(row.proxima_revisao) : null,
    ultimaTentativa: row.ultima_tentativa ? new Date(row.ultima_tentativa) : null,
    favoritado: Boolean(row.favoritado),
  };
}

export async function buscarProgressoExercicio(
  db: Database,
  perfilId: PerfilId,
  exercicioId: ExercicioId,
): Promise<Result<ProgressoExercicio | null, string>> {
  try {
    const rows = await db.select<ProgressoRow[]>(
      "SELECT * FROM progresso_exercicio WHERE perfil_id = ? AND exercicio_id = ?",
      [perfilId, exercicioId],
    );
    const row = rows[0];
    return ok(row ? rowParaProgresso(row) : null);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar progresso");
  }
}

export async function salvarProgresso(
  db: Database,
  progresso: ProgressoExercicio,
): Promise<Result<void, string>> {
  try {
    await db.execute(
      `INSERT INTO progresso_exercicio
         (perfil_id, exercicio_id, status, acertos_consecutivos, total_acertos,
          total_tentativas, fator_facilidade, intervalo_dias, proxima_revisao, ultima_tentativa, favoritado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(perfil_id, exercicio_id) DO UPDATE SET
         status = excluded.status,
         acertos_consecutivos = excluded.acertos_consecutivos,
         total_acertos = excluded.total_acertos,
         total_tentativas = excluded.total_tentativas,
         fator_facilidade = excluded.fator_facilidade,
         intervalo_dias = excluded.intervalo_dias,
         proxima_revisao = excluded.proxima_revisao,
         ultima_tentativa = excluded.ultima_tentativa`,
      [
        progresso.perfilId,
        progresso.exercicioId,
        progresso.status,
        progresso.acertosConsecutivos,
        progresso.totalAcertos,
        progresso.totalTentativas,
        progresso.fatorFacilidade,
        progresso.intervaloDias,
        progresso.proximaRevisao?.toISOString() ?? null,
        progresso.ultimaTentativa?.toISOString() ?? null,
        progresso.favoritado ? 1 : 0,
      ],
    );
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao salvar progresso");
  }
}

export async function toggleFavoritado(
  db: Database,
  perfilId: PerfilId,
  exercicioId: ExercicioId,
): Promise<Result<boolean, string>> {
  try {
    await db.execute(
      `INSERT INTO progresso_exercicio
         (perfil_id, exercicio_id, status, acertos_consecutivos, total_acertos,
          total_tentativas, fator_facilidade, intervalo_dias, proxima_revisao, ultima_tentativa, favoritado)
       VALUES (?, ?, 'nao_visto', 0, 0, 0, 2.5, 0, NULL, NULL, 1)
       ON CONFLICT(perfil_id, exercicio_id) DO UPDATE SET
         favoritado = CASE WHEN favoritado = 1 THEN 0 ELSE 1 END`,
      [perfilId, exercicioId],
    );
    const rows = await db.select<{ favoritado: number }[]>(
      "SELECT favoritado FROM progresso_exercicio WHERE perfil_id = ? AND exercicio_id = ?",
      [perfilId, exercicioId],
    );
    return ok(Boolean(rows[0]?.favoritado));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao alternar favorito");
  }
}

export async function listarProgressoPerfil(
  db: Database,
  perfilId: PerfilId,
): Promise<Result<ProgressoExercicio[], string>> {
  try {
    const rows = await db.select<ProgressoRow[]>(
      "SELECT * FROM progresso_exercicio WHERE perfil_id = ?",
      [perfilId],
    );
    return ok(rows.map(rowParaProgresso));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar progresso");
  }
}

export interface ProgressoUnidade {
  unidadeId: string;
  total: number;
  dominados: number;
  tentados: number;
}

export async function listarProgressoAgrupadoPorUnidade(
  db: Database,
  perfilId: PerfilId,
): Promise<Result<ProgressoUnidade[], string>> {
  try {
    const rows = await db.select<
      { unidade_id: string; total: number; dominados: number; tentados: number }[]
    >(
      `SELECT e.unidade_id,
              COUNT(*) as total,
              SUM(CASE WHEN pe.status = 'dominado' THEN 1 ELSE 0 END) as dominados,
              SUM(CASE WHEN pe.total_tentativas > 0 THEN 1 ELSE 0 END) as tentados
       FROM exercicios e
       LEFT JOIN progresso_exercicio pe ON pe.exercicio_id = e.id AND pe.perfil_id = ?
       GROUP BY e.unidade_id`,
      [perfilId],
    );
    return ok(
      rows.map((r) => ({
        unidadeId: r.unidade_id,
        total: r.total,
        dominados: r.dominados,
        tentados: r.tentados,
      })),
    );
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar progresso agrupado");
  }
}

export async function listarExerciciosParaRevisao(
  db: Database,
  perfilId: PerfilId,
): Promise<Result<ProgressoExercicio[], string>> {
  try {
    const agora = new Date().toISOString();
    const rows = await db.select<ProgressoRow[]>(
      `SELECT * FROM progresso_exercicio
       WHERE perfil_id = ? AND status = 'dominado' AND proxima_revisao <= ?`,
      [perfilId, agora],
    );
    return ok(rows.map(rowParaProgresso));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar exercícios para revisão");
  }
}
