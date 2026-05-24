import { describe, it, expect } from "vitest";
import { avaliarConquistas } from "@/features/sessao/domain/conquistas";
import type { ProgressoExercicio } from "@/shared/types/domain";
import { toPerfilId, toExercicioId } from "@/shared/types/branded";

function makeP(
  id: string,
  status: ProgressoExercicio["status"],
  tentativas: number,
  acertos: number,
): ProgressoExercicio {
  return {
    perfilId: toPerfilId("p1"),
    exercicioId: toExercicioId(id),
    status,
    acertosConsecutivos: 0,
    totalAcertos: acertos,
    totalTentativas: tentativas,
    fatorFacilidade: 2.5,
    intervaloDias: 0,
    proximaRevisao: null,
    ultimaTentativa: new Date(),
  };
}

describe("avaliarConquistas", () => {
  it("não desbloqueia nada com 0 dados", () => {
    const result = avaliarConquistas({ progresso: [], totalSessoes: 0, totalTentativas: 0 });
    expect(result).toHaveLength(0);
  });

  it("desbloqueia 'Primeiro Passo' após primeira sessão", () => {
    const result = avaliarConquistas({ progresso: [], totalSessoes: 1, totalTentativas: 5 });
    expect(result.some((c) => c.id === "c001")).toBe(true);
  });

  it("desbloqueia 'Mil Exercícios' após 1000 tentativas", () => {
    const result = avaliarConquistas({ progresso: [], totalSessoes: 10, totalTentativas: 1000 });
    expect(result.some((c) => c.id === "c008")).toBe(true);
  });

  it("desbloqueia 'Centenário Tático' com 100 dominados", () => {
    const progresso = Array.from({ length: 100 }, (_, i) => makeP(`e${i}`, "dominado", 5, 5));
    const result = avaliarConquistas({ progresso, totalSessoes: 5, totalTentativas: 500 });
    expect(result.some((c) => c.id === "c003")).toBe(true);
  });
});
