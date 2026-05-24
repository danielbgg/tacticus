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

  iniciarSessao: (sessaoId: SessaoId, modo: ModoSessao, fila: Exercicio[]) => void;
  avancarExercicio: () => void;
  registrarAcerto: (tempoMs: number) => void;
  registrarErro: (tempoMs: number) => void;
  usarDica: () => void;
  encerrarSessao: () => void;
  setFase: (fase: FaseExercicio) => void;
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

  iniciarSessao: (sessaoId, modo, fila) =>
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
    }),

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

  registrarAcerto: (tempoMs) =>
    set((s) => ({
      fase: "acerto",
      acertosNaSessao: s.acertosNaSessao + 1,
    })),

  registrarErro: (tempoMs) =>
    set((s) => ({
      fase: "erro",
      errosNaSessao: s.errosNaSessao + 1,
    })),

  usarDica: () => set((s) => ({ dicasUsadas: s.dicasUsadas + 1, fase: "dica" })),

  encerrarSessao: () =>
    set({
      sessaoId: null,
      fila: [],
      exercicioAtual: null,
      indiceAtual: 0,
      tentativas: [],
      dicasUsadas: 0,
      fase: "aguardando",
      iniciadaEm: null,
    }),

  setFase: (fase) => set({ fase }),
}));
