import { create } from "zustand";
import type { Exercicio, Tentativa, ModoSessao } from "@/shared/types/domain";
import type { SessaoId } from "@/shared/types/branded";

type FaseExercicio = "aguardando" | "tentando" | "acerto" | "erro" | "dica";

interface EstadoSessao {
  sessaoId: SessaoId | null;
  modo: ModoSessao;
  fila: Exercicio[];
  exercicioAtual: Exercicio | null;
  indiceAtual: number;
  tentativas: Tentativa[];
  dicasUsadas: number;
  fase: FaseExercicio;
  acertosNaSessao: number;
  errosNaSessao: number;
  iniciadaEm: Date | null;
  pausado: boolean;
  exerciciosConcluidos: string[];
  totalExerciciosUnidade: number;
  jaFeitosAnteriores: number;
  tempoTotalMs: number;
  errosSessionIds: string[];

  iniciarSessao: (
    sessaoId: SessaoId,
    modo: ModoSessao,
    fila: Exercicio[],
    totalUnidade?: number,
  ) => void;
  avancarExercicio: () => void;
  registrarAcerto: (tempoMs: number) => void;
  registrarErro: (tempoMs: number) => void;
  usarDica: () => void;
  resetarParaTentando: () => void;
  encerrarSessao: () => void;
  setFase: (fase: FaseExercicio) => void;
  pausar: () => void;
  retomar: () => void;
}

export const useSessaoStore = create<EstadoSessao>((set, get) => ({
  sessaoId: null,
  modo: "treino",
  fila: [],
  exercicioAtual: null,
  indiceAtual: 0,
  tentativas: [],
  dicasUsadas: 0,
  fase: "aguardando",
  acertosNaSessao: 0,
  errosNaSessao: 0,
  iniciadaEm: null,
  pausado: false,
  exerciciosConcluidos: [],
  totalExerciciosUnidade: 0,
  jaFeitosAnteriores: 0,
  tempoTotalMs: 0,
  errosSessionIds: [],

  iniciarSessao: (sessaoId, modo, fila, totalUnidade) => {
    const total = totalUnidade ?? fila.length;
    set({
      sessaoId,
      modo,
      fila,
      exercicioAtual: fila[0] ?? null,
      indiceAtual: 0,
      tentativas: [],
      dicasUsadas: 0,
      fase: "tentando",
      acertosNaSessao: 0,
      errosNaSessao: 0,
      iniciadaEm: new Date(),
      pausado: false,
      exerciciosConcluidos: [],
      totalExerciciosUnidade: total,
      jaFeitosAnteriores: total - fila.length,
      tempoTotalMs: 0,
      errosSessionIds: [],
    });
  },

  avancarExercicio: () => {
    const { fila, indiceAtual } = get();
    const proximo = indiceAtual + 1;
    set({
      exercicioAtual: fila[proximo] ?? null,
      indiceAtual: proximo,
      dicasUsadas: 0,
      fase: proximo < fila.length ? "tentando" : "aguardando",
    });
  },

  registrarAcerto: (tempoMs) => {
    const { exercicioAtual, exerciciosConcluidos } = get();
    const jaFeito = exercicioAtual ? exerciciosConcluidos.includes(exercicioAtual.id) : false;
    set((s) => ({
      fase: "acerto",
      acertosNaSessao: s.acertosNaSessao + 1,
      tempoTotalMs: s.tempoTotalMs + tempoMs,
      exerciciosConcluidos:
        exercicioAtual && !jaFeito
          ? [...s.exerciciosConcluidos, exercicioAtual.id]
          : s.exerciciosConcluidos,
    }));
  },

  registrarErro: (tempoMs) =>
    set((s) => ({
      fase: "erro",
      errosNaSessao: s.errosNaSessao + 1,
      errosSessionIds:
        s.exercicioAtual && !s.errosSessionIds.includes(s.exercicioAtual.id)
          ? [...s.errosSessionIds, s.exercicioAtual.id]
          : s.errosSessionIds,
    })),

  usarDica: () => set((s) => ({ dicasUsadas: s.dicasUsadas + 1, fase: "dica" })),

  resetarParaTentando: () => set({ fase: "tentando", dicasUsadas: 0 }),

  encerrarSessao: () =>
    set((s) => ({
      sessaoId: null,
      fila: [],
      exercicioAtual: null,
      indiceAtual: 0,
      tentativas: [],
      dicasUsadas: 0,
      fase: "aguardando",
      iniciadaEm: null,
      pausado: false,
      exerciciosConcluidos: [],
      totalExerciciosUnidade: 0,
      jaFeitosAnteriores: 0,
      tempoTotalMs: 0,
      // errosSessionIds é preservado para RefazerErrosPage — limpo em iniciarSessao
      errosSessionIds: s.errosSessionIds,
    })),

  setFase: (fase) => set({ fase }),

  pausar: () => set({ pausado: true }),
  retomar: () => set({ pausado: false }),
}));
