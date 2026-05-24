import { describe, it, expect } from "vitest";
import {
  inicializarProgresso,
  calcularProximaRevisao,
  SM2_FATOR_INICIAL,
  SM2_FATOR_MINIMO,
} from "@/shared/lib/sm2";
import type { ProgressoExercicio } from "@/shared/types/domain";
import { toPerfilId, toExercicioId } from "@/shared/types/branded";

const perfilId = toPerfilId("p1");
const exercicioId = toExercicioId("e1");

function makeProgresso(overrides: Partial<ProgressoExercicio> = {}): ProgressoExercicio {
  return {
    ...inicializarProgresso(perfilId, exercicioId),
    ...overrides,
  };
}

describe("inicializarProgresso", () => {
  it("cria progresso com valores iniciais corretos", () => {
    const p = inicializarProgresso(perfilId, exercicioId);
    expect(p.acertosConsecutivos).toBe(0);
    expect(p.status).toBe("nao_visto");
    expect(p.fatorFacilidade).toBe(SM2_FATOR_INICIAL);
    expect(p.proximaRevisao).toBeNull();
    expect(p.totalAcertos).toBe(0);
    expect(p.totalTentativas).toBe(0);
  });
});

describe("calcularProximaRevisao — acertos", () => {
  it("incrementa acertos consecutivos ao acertar sem dica", () => {
    const p = makeProgresso({ acertosConsecutivos: 0, status: "nao_visto" });
    const result = calcularProximaRevisao(p, true, 0, 3000, 5);
    expect(result.acertosConsecutivos).toBe(1);
    expect(result.status).toBe("em_progresso");
  });

  it("marca como dominado ao atingir N acertos consecutivos", () => {
    const p = makeProgresso({ acertosConsecutivos: 4, status: "em_progresso" });
    const result = calcularProximaRevisao(p, true, 0, 3000, 5);
    expect(result.status).toBe("dominado");
    expect(result.proximaRevisao).not.toBeNull();
    expect(result.acertosConsecutivos).toBe(5);
  });

  it("agenda revisão após dominar (intervalo >= 1 dia)", () => {
    const p = makeProgresso({ acertosConsecutivos: 4, status: "em_progresso" });
    const result = calcularProximaRevisao(p, true, 0, 3000, 5);
    const agora = new Date();
    expect(result.proximaRevisao!.getTime()).toBeGreaterThan(agora.getTime());
  });

  it("aumenta fator de facilidade ao acertar sem dica", () => {
    const p = makeProgresso({ fatorFacilidade: 2.5 });
    const result = calcularProximaRevisao(p, true, 0, 3000, 5);
    expect(result.fatorFacilidade).toBeGreaterThan(2.5);
  });

  it("incrementa totalAcertos e totalTentativas ao acertar", () => {
    const p = makeProgresso({ totalAcertos: 3, totalTentativas: 5 });
    const result = calcularProximaRevisao(p, true, 0, 3000, 5);
    expect(result.totalAcertos).toBe(4);
    expect(result.totalTentativas).toBe(6);
  });
});

describe("calcularProximaRevisao — erros", () => {
  it("reinicia acertos consecutivos ao errar", () => {
    const p = makeProgresso({ acertosConsecutivos: 3, status: "em_progresso" });
    const result = calcularProximaRevisao(p, false, 0, 3000, 5);
    expect(result.acertosConsecutivos).toBe(0);
  });

  it("mantém status dominado ao errar revisão (não regride para nao_visto)", () => {
    const p = makeProgresso({ acertosConsecutivos: 5, status: "dominado" });
    const result = calcularProximaRevisao(p, false, 0, 3000, 5);
    expect(result.status).toBe("dominado");
    expect(result.proximaRevisao).toBeNull();
  });

  it("reduz fator de facilidade ao errar, mas nunca abaixo do mínimo", () => {
    const p = makeProgresso({ fatorFacilidade: SM2_FATOR_MINIMO + 0.1 });
    const result = calcularProximaRevisao(p, false, 0, 3000, 5);
    expect(result.fatorFacilidade).toBeGreaterThanOrEqual(SM2_FATOR_MINIMO);
  });

  it("fator de facilidade nunca fica abaixo de 1.3", () => {
    const p = makeProgresso({ fatorFacilidade: SM2_FATOR_MINIMO });
    const result = calcularProximaRevisao(p, false, 0, 3000, 5);
    expect(result.fatorFacilidade).toBe(SM2_FATOR_MINIMO);
  });

  it("incrementa totalTentativas mas não totalAcertos ao errar", () => {
    const p = makeProgresso({ totalAcertos: 2, totalTentativas: 4 });
    const result = calcularProximaRevisao(p, false, 0, 3000, 5);
    expect(result.totalAcertos).toBe(2);
    expect(result.totalTentativas).toBe(5);
  });
});

describe("calcularProximaRevisao — penalidade de dica", () => {
  it("dica nível 1 reduz levemente o fator de facilidade", () => {
    const p = makeProgresso({ fatorFacilidade: 2.5 });
    const semDica = calcularProximaRevisao(p, true, 0, 3000, 5);
    const comDica1 = calcularProximaRevisao(p, true, 1, 3000, 5);
    expect(comDica1.fatorFacilidade).toBeLessThan(semDica.fatorFacilidade);
  });

  it("dica nível 2 penaliza mais que dica nível 1", () => {
    const p = makeProgresso({ fatorFacilidade: 2.5 });
    const comDica1 = calcularProximaRevisao(p, true, 1, 3000, 5);
    const comDica2 = calcularProximaRevisao(p, true, 2, 3000, 5);
    expect(comDica2.fatorFacilidade).toBeLessThan(comDica1.fatorFacilidade);
  });

  it("dica nível 3 conta como erro (reinicia contador)", () => {
    const p = makeProgresso({ acertosConsecutivos: 3 });
    const result = calcularProximaRevisao(p, true, 3, 3000, 5);
    expect(result.acertosConsecutivos).toBe(0);
  });
});

describe("calcularProximaRevisao — intervalos de revisão", () => {
  it("primeiro domínio agenda revisão em ~1 dia", () => {
    const p = makeProgresso({ acertosConsecutivos: 4 });
    const result = calcularProximaRevisao(p, true, 0, 3000, 5);
    const diffMs = result.proximaRevisao!.getTime() - Date.now();
    const diffDias = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDias).toBeGreaterThanOrEqual(0.9);
    expect(diffDias).toBeLessThanOrEqual(3.5);
  });
});
