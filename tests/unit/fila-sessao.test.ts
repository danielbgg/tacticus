import { describe, it, expect } from "vitest";
import {
  montarFila,
  proximoExercicio,
  registrarResultado,
  filaEsgotada,
} from "@/features/exercicio/domain/fila-sessao";
import type { Exercicio } from "@/shared/types/domain";
import { toExercicioId, toUnidadeId, toPartidaId } from "@/shared/types/branded";

function makeExercicio(id: string): Exercicio {
  return {
    id: toExercicioId(id),
    unidadeId: toUnidadeId("u1"),
    partida: { id: toPartidaId("p1"), brancas: "A", negras: "B" },
    fenInicial: "startpos",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    tipo: "tatica",
    lancesSolucao: ["e2e4"],
    ordem: 1,
  };
}

const ex1 = makeExercicio("e1");
const ex2 = makeExercicio("e2");
const ex3 = makeExercicio("e3");

describe("montarFila", () => {
  it("retorna fila na ordem dos exercícios", () => {
    const fila = montarFila([ex1, ex2, ex3]);
    expect(fila.exercicios[0]?.id).toBe("e1");
    expect(fila.exercicios.length).toBe(3);
  });

  it("fila vazia quando lista vazia", () => {
    const fila = montarFila([]);
    expect(filaEsgotada(fila)).toBe(true);
  });
});

describe("proximoExercicio", () => {
  it("retorna primeiro exercício da fila", () => {
    const fila = montarFila([ex1, ex2]);
    expect(proximoExercicio(fila)?.id).toBe("e1");
  });

  it("retorna null quando fila vazia", () => {
    const fila = montarFila([]);
    expect(proximoExercicio(fila)).toBeNull();
  });
});

describe("registrarResultado", () => {
  it("acerto avança para próximo exercício", () => {
    const fila = montarFila([ex1, ex2, ex3]);
    const novaFila = registrarResultado(fila, true);
    expect(proximoExercicio(novaFila)?.id).toBe("e2");
  });

  it("erro reinicia o exercício no final da fila", () => {
    const fila = montarFila([ex1, ex2]);
    const novaFila = registrarResultado(fila, false);
    // ex2 agora é o próximo, ex1 voltou ao final
    expect(proximoExercicio(novaFila)?.id).toBe("e2");
    // e ex1 ainda está na fila (ao final)
    expect(novaFila.exercicios.some((e) => e.id === "e1")).toBe(true);
  });

  it("fila esgota após acertar todos os exercícios", () => {
    let fila = montarFila([ex1, ex2]);
    fila = registrarResultado(fila, true);
    fila = registrarResultado(fila, true);
    expect(filaEsgotada(fila)).toBe(true);
  });
});

describe("filaEsgotada", () => {
  it("false quando há exercícios", () => {
    const fila = montarFila([ex1]);
    expect(filaEsgotada(fila)).toBe(false);
  });

  it("true quando fila está vazia", () => {
    const fila = montarFila([ex1]);
    const depois = registrarResultado(fila, true);
    expect(filaEsgotada(depois)).toBe(true);
  });
});
