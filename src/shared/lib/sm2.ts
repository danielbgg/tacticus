import type { ProgressoExercicio, StatusExercicio } from "@/shared/types/domain";
import type { PerfilId, ExercicioId } from "@/shared/types/branded";

export const SM2_FATOR_INICIAL = 2.5;
export const SM2_FATOR_MINIMO = 1.3;

const INTERVALOS_BASE_DIAS = [1, 3, 7, 14, 30, 90];

const PENALIDADE_DICA: Record<0 | 1 | 2 | 3, number> = {
  0: 0,
  1: -0.05,
  2: -0.1,
  3: 0, // nível 3 conta como erro — tratado antes de chegar aqui
};

export function inicializarProgresso(
  perfilId: PerfilId,
  exercicioId: ExercicioId,
): ProgressoExercicio {
  return {
    perfilId,
    exercicioId,
    status: "nao_visto",
    acertosConsecutivos: 0,
    totalAcertos: 0,
    totalTentativas: 0,
    fatorFacilidade: SM2_FATOR_INICIAL,
    intervaloDias: 0,
    proximaRevisao: null,
    ultimaTentativa: null,
  };
}

export function calcularProximaRevisao(
  progresso: ProgressoExercicio,
  acertou: boolean,
  dicasUsadas: 0 | 1 | 2 | 3,
  _tempoRespostaMs: number,
  acertosParaDominar: number,
): ProgressoExercicio {
  // Dica nível 3 conta como erro
  const errou = !acertou || dicasUsadas === 3;

  const novoTotal = progresso.totalTentativas + 1;
  const novosAcertos = errou ? progresso.totalAcertos : progresso.totalAcertos + 1;

  if (errou) {
    return {
      ...progresso,
      acertosConsecutivos: 0,
      totalTentativas: novoTotal,
      totalAcertos: novosAcertos,
      status: progresso.status === "nao_visto" ? "em_progresso" : progresso.status,
      proximaRevisao: null,
      fatorFacilidade: Math.max(SM2_FATOR_MINIMO, progresso.fatorFacilidade - 0.2),
      ultimaTentativa: new Date(),
    };
  }

  const penalidade = PENALIDADE_DICA[dicasUsadas];
  const novoFator = Math.max(SM2_FATOR_MINIMO, progresso.fatorFacilidade + 0.1 + penalidade);
  const novosConsecutivos = progresso.acertosConsecutivos + 1;
  const dominado = novosConsecutivos >= acertosParaDominar;

  let novoStatus: StatusExercicio =
    progresso.status === "nao_visto" ? "em_progresso" : progresso.status;
  let proximaRevisao = progresso.proximaRevisao;
  let intervaloDias = progresso.intervaloDias;

  if (dominado) {
    novoStatus = "dominado";
    const repeticao = Math.min(
      Math.floor((novosConsecutivos - acertosParaDominar) / acertosParaDominar),
      INTERVALOS_BASE_DIAS.length - 1,
    );
    const diasBase = INTERVALOS_BASE_DIAS[repeticao] ?? 1;
    intervaloDias = Math.round(diasBase * novoFator);
    proximaRevisao = new Date(Date.now() + intervaloDias * 24 * 60 * 60 * 1000);
  }

  return {
    ...progresso,
    acertosConsecutivos: novosConsecutivos,
    totalAcertos: novosAcertos,
    totalTentativas: novoTotal,
    status: novoStatus,
    proximaRevisao,
    intervaloDias,
    fatorFacilidade: novoFator,
    ultimaTentativa: new Date(),
  };
}
