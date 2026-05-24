import { useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TabuleiroInterativo } from "@/features/exercicio/components/TabuleiroInterativo";
import { PainelExercicio } from "@/features/exercicio/components/PainelExercicio";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { useSessaoTreino } from "@/features/exercicio/hooks/useSessaoTreino";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { EmptyState } from "@/shared/components/EmptyState/EmptyState";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import type { UnidadeId } from "@/shared/types/branded";

export function TreinoPage() {
  const { t } = useTranslation("sessao");
  const navigate = useNavigate();
  const { unidadeId } = useParams({ from: "/treinar/$unidadeId" });
  const configuracoes = usePerfilStore((s) => s.configuracoes);
  const { iniciar, processarLance } = useSessaoTreino();
  const store = useSessaoStore();

  useEffect(() => {
    iniciar.mutate(unidadeId as UnidadeId);
    return () => store.encerrarSessao();
  }, [unidadeId]);

  function handleLanceCorreto(tempoMs: number) {
    processarLance(true, tempoMs);
  }

  function handleLanceErrado(tempoMs: number) {
    processarLance(false, tempoMs);
  }

  function handleUsarDica() {
    store.usarDica();
  }

  function handleDesistir() {
    processarLance(false, 0);
  }

  function handleProximo() {
    store.avancarExercicio();
  }

  if (iniciar.isPending) {
    return (
      <div className="flex flex-col gap-6 p-6" aria-busy="true" aria-label="Carregando sessão">
        <Skeleton className="h-[480px] w-full max-w-[560px] mx-auto rounded-xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (store.exercicioAtual === null && store.fila.length === 0 && !iniciar.isPending) {
    return (
      <EmptyState
        icone="🏆"
        titulo={t("semExercicios")}
        descricao={t("semExerciciosDescricao")}
        acaoLabel={t("voltarBanco")}
        onAcao={() => navigate({ to: "/banco" })}
      />
    );
  }

  if (!store.exercicioAtual) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <span className="text-6xl" aria-hidden="true">
          🎯
        </span>
        <h2 className="text-2xl font-bold text-[var(--color-conteudo-primario)]">
          {t("sessaoConcluida")}
        </h2>
        <p className="text-[var(--color-conteudo-secundario)]">
          {t("sessaoConcluidaResultado", {
            acertos: store.acertosNaSessao,
            erros: store.errosNaSessao,
          })}
        </p>
        <button
          onClick={() => navigate({ to: "/banco" })}
          className="mt-4 rounded-lg bg-[var(--color-acento)] px-6 py-3 font-semibold text-white"
        >
          {t("voltarBanco")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <TabuleiroInterativo
          onLanceCorreto={handleLanceCorreto}
          onLanceErrado={handleLanceErrado}
          {...(configuracoes?.estiloTabuleiro != null
            ? { estiloTabuleiro: configuracoes.estiloTabuleiro }
            : {})}
          {...(configuracoes?.modoDaltonico != null
            ? { modoDaltonico: configuracoes.modoDaltonico }
            : {})}
        />
        <PainelExercicio
          onUsarDica={handleUsarDica}
          onDesistir={handleDesistir}
          onProximo={handleProximo}
        />
      </div>
    </div>
  );
}
