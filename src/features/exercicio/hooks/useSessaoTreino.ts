import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { getDb } from "@/db/schema";
import { listarExerciciosDaUnidade } from "@/db/queries/exercicios";
import { buscarProgressoExercicio, salvarProgresso } from "@/db/queries/progresso";
import { calcularProximaRevisao, inicializarProgresso } from "@/shared/lib/sm2";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import type { Exercicio } from "@/shared/types/domain";
import type { UnidadeId, SessaoId } from "@/shared/types/branded";
import { randomUUID } from "crypto";

export function useSessaoTreino() {
  const store = useSessaoStore();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);

  const iniciarMutation = useMutation({
    mutationFn: async (unidadeId: UnidadeId) => {
      if (!perfilAtivoId) throw new Error("Nenhum perfil ativo");
      const db = await getDb();
      const rExercicios = await listarExerciciosDaUnidade(db as never, unidadeId);
      if (!rExercicios.ok) throw new Error(rExercicios.error);

      // Filtra exercícios já dominados que não precisam de revisão hoje
      const agora = new Date();
      const fila: Exercicio[] = [];
      for (const ex of rExercicios.value) {
        const rProg = await buscarProgressoExercicio(db as never, perfilAtivoId, ex.id);
        if (rProg.ok && rProg.value) {
          if (
            rProg.value.status === "dominado" &&
            rProg.value.proximaRevisao &&
            rProg.value.proximaRevisao > agora
          ) {
            continue; // Não entra na fila hoje
          }
        }
        fila.push(ex);
      }

      const sessaoId = randomUUID() as SessaoId;
      store.iniciarSessao(sessaoId, "treino", fila);
      return { sessaoId, total: fila.length };
    },
  });

  const processarLance = useCallback(
    async (acertou: boolean, tempoMs: number) => {
      if (!perfilAtivoId || !store.exercicioAtual) return;

      const db = await getDb();
      const ex = store.exercicioAtual;

      const rProg = await buscarProgressoExercicio(db as never, perfilAtivoId, ex.id);
      const progressoAtual =
        rProg.ok && rProg.value ? rProg.value : inicializarProgresso(perfilAtivoId, ex.id);

      const novoProgresso = calcularProximaRevisao(
        progressoAtual,
        acertou,
        Math.min(store.dicasUsadas, 3) as 0 | 1 | 2 | 3,
        tempoMs,
        5, // acertosParaDominar — TODO: ler do perfil
      );

      await salvarProgresso(db as never, novoProgresso);

      if (acertou) {
        store.registrarAcerto(tempoMs);
      } else {
        store.registrarErro(tempoMs);
        // Erro: reinserir no final da fila (lógica Chessimo Circles)
        useSessaoStore.setState((s) => ({
          fila: [...s.fila, ex],
        }));
      }
    },
    [perfilAtivoId, store],
  );

  return { iniciar: iniciarMutation, processarLance };
}
