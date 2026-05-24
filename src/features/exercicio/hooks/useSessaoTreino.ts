import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { getDb } from "@/db/schema";
import { listarExerciciosDaUnidade } from "@/db/queries/exercicios";
import { buscarProgressoExercicio, salvarProgresso } from "@/db/queries/progresso";
import { registrarTentativa } from "@/db/queries/tentativas";
import { criarSessao, encerrarSessao } from "@/db/queries/sessoes";
import {
  buscarSessaoPausada,
  salvarSessaoPausada,
  removerSessaoPausada,
  type SessaoPausada,
} from "@/db/queries/sessoesPausadas";
import { calcularProximaRevisao, inicializarProgresso } from "@/shared/lib/sm2";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import type { Exercicio } from "@/shared/types/domain";
import type { UnidadeId, SessaoId } from "@/shared/types/branded";

export interface DadosIniciar {
  sessaoPausada: SessaoPausada | null;
  filaFresca: Exercicio[];
  novoSessaoId: SessaoId;
}

export function useSessaoTreino() {
  const store = useSessaoStore();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);

  // Carrega a fila e verifica sessão pausada — NÃO inicia a sessão ainda
  const iniciarMutation = useMutation({
    mutationFn: async (unidadeId: UnidadeId): Promise<DadosIniciar> => {
      if (!perfilAtivoId) throw new Error("Nenhum perfil ativo");
      const db = await getDb();

      const rPausada = await buscarSessaoPausada(db as never, perfilAtivoId, unidadeId);
      const sessaoPausada = rPausada.ok ? rPausada.value : null;

      const rExercicios = await listarExerciciosDaUnidade(db as never, unidadeId);
      if (!rExercicios.ok) throw new Error(rExercicios.error);

      const agora = new Date();
      const filaFresca: Exercicio[] = [];
      for (const ex of rExercicios.value) {
        const rProg = await buscarProgressoExercicio(db as never, perfilAtivoId, ex.id);
        if (rProg.ok && rProg.value) {
          if (
            rProg.value.status === "dominado" &&
            rProg.value.proximaRevisao &&
            rProg.value.proximaRevisao > agora
          ) {
            continue;
          }
        }
        filaFresca.push(ex);
      }

      const rSessao = await criarSessao(db as never, { perfilId: perfilAtivoId, modo: "treino" });
      const novoSessaoId = rSessao.ok ? rSessao.value.id : (crypto.randomUUID() as SessaoId);

      return { sessaoPausada, filaFresca, novoSessaoId };
    },
  });

  // Chamado após o usuário escolher retomar ou começar do zero
  const confirmar = useCallback(
    async (unidadeId: UnidadeId, opcao: "retomar" | "fresco") => {
      if (!iniciarMutation.data || !perfilAtivoId) return;
      const { sessaoPausada, filaFresca, novoSessaoId } = iniciarMutation.data;
      const db = await getDb();

      if (sessaoPausada) {
        await removerSessaoPausada(db as never, perfilAtivoId, unidadeId);
      }

      if (opcao === "retomar" && sessaoPausada) {
        store.iniciarSessao(sessaoPausada.sessaoId, "treino", sessaoPausada.fila);
      } else {
        store.iniciarSessao(novoSessaoId, "treino", filaFresca);
      }
    },
    [iniciarMutation.data, perfilAtivoId, store],
  );

  // Chamado no cleanup do TreinoPage — captura estado antes do primeiro await
  const pausar = useCallback(
    async (unidadeId: UnidadeId) => {
      const { fila, indiceAtual, sessaoId, exercicioAtual, acertosNaSessao, errosNaSessao } =
        useSessaoStore.getState();
      if (!perfilAtivoId) return;

      const db = await getDb();

      // Persiste os totais reais da sessão no banco
      if (sessaoId) {
        await encerrarSessao(db as never, sessaoId, {
          totalTentativas: acertosNaSessao + errosNaSessao,
          totalAcertos: acertosNaSessao,
        });
      }

      if (!sessaoId || !exercicioAtual) {
        await removerSessaoPausada(db as never, perfilAtivoId, unidadeId);
        return;
      }

      const filaRestante = fila.slice(indiceAtual);
      if (filaRestante.length === 0) {
        await removerSessaoPausada(db as never, perfilAtivoId, unidadeId);
        return;
      }

      await salvarSessaoPausada(db as never, {
        perfilId: perfilAtivoId,
        unidadeId,
        sessaoId,
        fila: filaRestante,
      });
    },
    [perfilAtivoId],
  );

  const processarLance = useCallback(
    async (acertou: boolean, tempoMs: number) => {
      if (!perfilAtivoId || !store.exercicioAtual || !store.sessaoId) return;

      const db = await getDb();
      const ex = store.exercicioAtual;
      const sessaoId = store.sessaoId;

      await registrarTentativa(db as never, {
        sessaoId,
        perfilId: perfilAtivoId,
        exercicioId: ex.id,
        acertou,
        tempoRespostaMs: tempoMs,
        dicasUsadas: Math.min(store.dicasUsadas, 3) as 0 | 1 | 2 | 3,
      });

      const rProg = await buscarProgressoExercicio(db as never, perfilAtivoId, ex.id);
      const progressoAtual =
        rProg.ok && rProg.value ? rProg.value : inicializarProgresso(perfilAtivoId, ex.id);

      const novoProgresso = calcularProximaRevisao(
        progressoAtual,
        acertou,
        Math.min(store.dicasUsadas, 3) as 0 | 1 | 2 | 3,
        tempoMs,
        5,
      );

      await salvarProgresso(db as never, novoProgresso);

      if (acertou) {
        store.registrarAcerto(tempoMs);
      } else {
        store.registrarErro(tempoMs);
        useSessaoStore.setState((s) => ({
          fila: [...s.fila, ex],
        }));
      }
    },
    [perfilAtivoId, store],
  );

  return { iniciar: iniciarMutation, confirmar, pausar, processarLance };
}
