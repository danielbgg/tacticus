import type { ProgressoExercicio } from "@/shared/types/domain";

const LIMIAR_TAXA_FRACO = 60; // abaixo de 60% é ponto fraco
const MIN_TENTATIVAS = 3;

export function calcularTaxaAcerto(progresso: ProgressoExercicio): number {
  if (progresso.totalTentativas === 0) return 0;
  return Math.round((progresso.totalAcertos / progresso.totalTentativas) * 100);
}

export function detectarPontosFracos(
  lista: ProgressoExercicio[],
  minTentativas = MIN_TENTATIVAS,
): ProgressoExercicio[] {
  return lista
    .filter((p) => p.totalTentativas >= minTentativas)
    .filter((p) => calcularTaxaAcerto(p) < LIMIAR_TAXA_FRACO)
    .sort((a, b) => calcularTaxaAcerto(a) - calcularTaxaAcerto(b));
}
