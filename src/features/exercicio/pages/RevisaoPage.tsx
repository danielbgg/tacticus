import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TabuleiroInterativo } from "@/features/exercicio/components/TabuleiroInterativo";
import { PainelExercicio } from "@/features/exercicio/components/PainelExercicio";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { getDb } from "@/db/schema";
import { listarExerciciosParaRevisao } from "@/db/queries/progresso";
import { buscarExercicio } from "@/db/queries/exercicios";
import { calcularProximaRevisao, inicializarProgresso } from "@/shared/lib/sm2";
import { salvarProgresso, buscarProgressoExercicio } from "@/db/queries/progresso";
import { EmptyState } from "@/shared/components/EmptyState/EmptyState";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";

import type { SessaoId } from "@/shared/types/branded";

export function RevisaoPage() {
  const navigate = useNavigate();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);
  const configuracoes = usePerfilStore((s) => s.configuracoes);
  const store = useSessaoStore();

  const { data: exercicios, isLoading } = useQuery({
    queryKey: ["revisao", perfilAtivoId],
    enabled: !!perfilAtivoId,
    queryFn: async () => {
      if (!perfilAtivoId) return [];
      const db = await getDb();
      const rProgresso = await listarExerciciosParaRevisao(db as never, perfilAtivoId);
      if (!rProgresso.ok) return [];

      const lista = [];
      for (const p of rProgresso.value) {
        const rEx = await buscarExercicio(db as never, p.exercicioId);
        if (rEx.ok && rEx.value) lista.push(rEx.value);
      }
      return lista;
    },
  });

  useEffect(() => {
    if (exercicios && exercicios.length > 0) {
      store.iniciarSessao(crypto.randomUUID() as SessaoId, "revisao", exercicios);
    }
    return () => store.encerrarSessao();
  }, [exercicios]);

  async function processarLance(acertou: boolean, tempoMs: number) {
    if (!perfilAtivoId || !store.exercicioAtual) return;
    const db = await getDb();
    const ex = store.exercicioAtual;
    const rProg = await buscarProgressoExercicio(db as never, perfilAtivoId, ex.id);
    const atual =
      rProg.ok && rProg.value ? rProg.value : inicializarProgresso(perfilAtivoId, ex.id);
    const novo = calcularProximaRevisao(
      atual,
      acertou,
      Math.min(store.dicasUsadas, 3) as 0 | 1 | 2 | 3,
      tempoMs,
      5,
    );
    await salvarProgresso(db as never, novo);

    if (acertou) {
      store.registrarAcerto(tempoMs);
    } else {
      store.registrarErro(tempoMs);
      useSessaoStore.setState((s) => ({ fila: [...s.fila, ex] }));
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col gap-6" aria-busy="true">
        <Skeleton className="h-[480px] w-full max-w-[560px] mx-auto rounded-xl" />
      </div>
    );
  }

  if (!exercicios || exercicios.length === 0) {
    return (
      <EmptyState
        icone="🎯"
        titulo="Nenhuma revisão pendente"
        descricao="Todos os exercícios dominados estão em dia. Continue treinando!"
        acaoLabel="Ir para o banco"
        onAcao={() => navigate({ to: "/circulos" })}
      />
    );
  }

  if (!store.exercicioAtual) {
    return (
      <EmptyState
        icone="🏆"
        titulo="Revisão concluída!"
        descricao={`${store.acertosNaSessao} acertos e ${store.errosNaSessao} erros nessa sessão.`}
        acaoLabel="Voltar ao início"
        onAcao={() => navigate({ to: "/home" })}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6 flex flex-col gap-5">
      {/* Banner informativo */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a3a] to-[#0f0f2a] border border-[#4040a0]/50 p-5">
        <div className="absolute top-0 right-0 w-40 h-40 opacity-5 text-[8rem] leading-none select-none pointer-events-none">
          🧠
        </div>
        <div className="relative">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Repetição Espaçada · Algoritmo SM-2
          </span>
          <h1 className="text-base font-bold text-white mt-1 mb-1">Revisão Espaçada</h1>
          <p className="text-sm text-indigo-200/70 max-w-lg">
            Ao dominar um exercício (5 acertos consecutivos), ele sai do treino e entra na fila de
            revisão. O algoritmo SM-2 agenda automaticamente quando você precisa revê-lo —
            intervalos crescentes que treinam a memória de longo prazo sem desperdiçar tempo com o
            que você já sabe.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-indigo-300/60">
            <span>1ª revisão: ~2 dias</span>
            <span>·</span>
            <span>2ª: ~7 dias</span>
            <span>·</span>
            <span>3ª: ~17 dias</span>
            <span>·</span>
            <span>4ª: ~35 dias</span>
            <span>·</span>
            <span>5ª: ~75 dias</span>
            <span>·</span>
            <span>6ª+: ~225 dias</span>
          </div>
          <div className="mt-2 text-xs text-indigo-400/80 font-medium">
            {exercicios.length}{" "}
            {exercicios.length === 1 ? "exercício pendente" : "exercícios pendentes"} hoje
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <TabuleiroInterativo
          onLanceCorreto={(t) => processarLance(true, t)}
          onLanceErrado={(t) => processarLance(false, t)}
          {...(configuracoes?.estiloTabuleiro != null
            ? { estiloTabuleiro: configuracoes.estiloTabuleiro }
            : {})}
          {...(configuracoes?.modoDaltonico != null
            ? { modoDaltonico: configuracoes.modoDaltonico }
            : {})}
        />
        <PainelExercicio
          onUsarDica={() => store.usarDica()}
          onDesistir={() => processarLance(false, 0)}
          onProximo={() => store.avancarExercicio()}
          onTentarNovamente={() => store.resetarParaTentando()}
        />
      </div>
    </div>
  );
}
