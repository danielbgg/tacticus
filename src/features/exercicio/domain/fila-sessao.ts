import type { Exercicio } from "@/shared/types/domain";

export interface FilaSessao {
  exercicios: Exercicio[];
  indice: number;
}

export function montarFila(exercicios: Exercicio[]): FilaSessao {
  return { exercicios: [...exercicios], indice: 0 };
}

export function proximoExercicio(fila: FilaSessao): Exercicio | null {
  return fila.exercicios[fila.indice] ?? null;
}

export function registrarResultado(fila: FilaSessao, acertou: boolean): FilaSessao {
  if (acertou) {
    return { ...fila, indice: fila.indice + 1 };
  }
  // Erro: remove da posição atual e reinsere ao final
  const exercicioAtual = fila.exercicios[fila.indice];
  if (!exercicioAtual) return fila;
  const restantes = fila.exercicios.slice(fila.indice + 1);
  const novosExercicios = [...fila.exercicios.slice(0, fila.indice), ...restantes, exercicioAtual];
  return { exercicios: novosExercicios, indice: fila.indice };
}

export function filaEsgotada(fila: FilaSessao): boolean {
  return fila.indice >= fila.exercicios.length;
}

export function progresso(fila: FilaSessao): { atual: number; total: number; percentual: number } {
  const total = fila.exercicios.length;
  const atual = Math.min(fila.indice, total);
  return { atual, total, percentual: total > 0 ? Math.round((atual / total) * 100) : 0 };
}
