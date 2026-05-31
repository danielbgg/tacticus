import { describe, it, expect } from "vitest";
import {
  detectarPontosFracos,
  calcularTaxaAcerto,
} from "@/features/estatisticas/domain/detectar-pontos-fracos";
import type { ProgressoExercicio } from "@/shared/types/domain";
import { toPerfilId, toExercicioId } from "@/shared/types/branded";

function makeProgresso(id: string, acertos: number, tentativas: number): ProgressoExercicio {
  return {
    perfilId: toPerfilId("p1"),
    exercicioId: toExercicioId(id),
    status: "em_progresso",
    acertosConsecutivos: 0,
    totalAcertos: acertos,
    totalTentativas: tentativas,
    fatorFacilidade: 2.5,
    intervaloDias: 0,
    proximaRevisao: null,
    ultimaTentativa: new Date(),
    favoritado: false,
  };
}

describe("calcularTaxaAcerto", () => {
  it("retorna 0 para sem tentativas", () => {
    expect(calcularTaxaAcerto(makeProgresso("e1", 0, 0))).toBe(0);
  });

  it("calcula taxa corretamente", () => {
    expect(calcularTaxaAcerto(makeProgresso("e1", 3, 10))).toBe(30);
  });

  it("retorna 100 para 100% de acerto", () => {
    expect(calcularTaxaAcerto(makeProgresso("e1", 5, 5))).toBe(100);
  });
});

describe("detectarPontosFracos", () => {
  it("retorna lista vazia quando menos de 3 tentativas em todos", () => {
    const lista = [makeProgresso("e1", 1, 2), makeProgresso("e2", 0, 1)];
    expect(detectarPontosFracos(lista, 3)).toHaveLength(0);
  });

  it("retorna exercícios com taxa abaixo do limiar", () => {
    const lista = [
      makeProgresso("e1", 1, 10), // 10% — ponto fraco
      makeProgresso("e2", 8, 10), // 80% — ok
      makeProgresso("e3", 3, 10), // 30% — ponto fraco
    ];
    const fracos = detectarPontosFracos(lista, 3);
    expect(fracos.length).toBe(2);
    expect(fracos[0]?.exercicioId).toBe("e1"); // Pior primeiro
  });

  it("ordena por taxa crescente (pior primeiro)", () => {
    const lista = [
      makeProgresso("e1", 5, 10), // 50%
      makeProgresso("e2", 2, 10), // 20%
      makeProgresso("e3", 8, 10), // 80%
    ];
    const fracos = detectarPontosFracos(lista, 3);
    expect(fracos[0]?.exercicioId).toBe("e2");
  });
});
