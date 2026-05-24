import type { Database } from "better-sqlite3";
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
  };
}

export async function buscarProgressoExercicio(
  db: Database,
  perfilId: PerfilId,
  exercicioId: ExercicioId,
): Promise<Result<ProgressoExercicio | null, string>> {
  try {
    const row = db
      .prepare("SELECT * FROM progresso_exercicio WHERE perfil_id = ? AND exercicio_id = ?")
      .get(perfilId, exercicioId) as ProgressoRow | undefined;
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
    db.prepare(
      `INSERT INTO progresso_exercicio
         (perfil_id, exercicio_id, status, acertos_consecutivos, total_acertos,
          total_tentativas, fator_facilidade, intervalo_dias, proxima_revisao, ultima_tentativa)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(perfil_id, exercicio_id) DO UPDATE SET
         status = excluded.status,
         acertos_consecutivos = excluded.acertos_consecutivos,
         total_acertos = excluded.total_acertos,
         total_tentativas = excluded.total_tentativas,
         fator_facilidade = excluded.fator_facilidade,
         intervalo_dias = excluded.intervalo_dias,
         proxima_revisao = excluded.proxima_revisao,
         ultima_tentativa = excluded.ultima_tentativa`,
    ).run(
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
    );
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao salvar progresso");
  }
}

export async function listarProgressoPerfil(
  db: Database,
  perfilId: PerfilId,
): Promise<Result<ProgressoExercicio[], string>> {
  try {
    const rows = db
      .prepare("SELECT * FROM progresso_exercicio WHERE perfil_id = ?")
      .all(perfilId) as ProgressoRow[];
    return ok(rows.map(rowParaProgresso));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar progresso");
  }
}

export async function listarExerciciosParaRevisao(
  db: Database,
  perfilId: PerfilId,
): Promise<Result<ProgressoExercicio[], string>> {
  try {
    const agora = new Date().toISOString();
    const rows = db
      .prepare(
        `SELECT * FROM progresso_exercicio
         WHERE perfil_id = ? AND status = 'dominado' AND proxima_revisao <= ?`,
      )
      .all(perfilId, agora) as ProgressoRow[];
    return ok(rows.map(rowParaProgresso));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao listar exercícios para revisão");
  }
}
