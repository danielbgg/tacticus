import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/Card/Card";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import { ErrorMessage } from "@/shared/components/ErrorMessage/ErrorMessage";
import { EmptyState } from "@/shared/components/EmptyState/EmptyState";
import { Heatmap } from "@/features/estatisticas/components/Heatmap";
import { PontosFracos } from "@/features/estatisticas/components/PontosFracos";
import { HistoricoSessoes } from "@/features/estatisticas/components/HistoricoSessoes";
import { getDb } from "@/db/schema";
import { buscarVisaoGeral, buscarHeatmap } from "@/db/queries/estatisticas";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";

type AbaAtiva = "visao-geral" | "historico" | "pontos-fracos";

export function EstatisticasPage() {
  const { t } = useTranslation("estatisticas");
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);
  const [aba, setAba] = useState<AbaAtiva>("visao-geral");

  const {
    data: visao,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["estatisticas-visao", perfilAtivoId],
    enabled: !!perfilAtivoId,
    queryFn: async () => {
      if (!perfilAtivoId) return null;
      const db = await getDb();
      const r = await buscarVisaoGeral(db as never, perfilAtivoId);
      if (!r.ok) throw new Error(r.error);
      return r.value;
    },
  });

  const { data: heatmap } = useQuery({
    queryKey: ["heatmap", perfilAtivoId],
    enabled: !!perfilAtivoId && aba === "visao-geral",
    queryFn: async () => {
      if (!perfilAtivoId) return [];
      const db = await getDb();
      const r = await buscarHeatmap(db as never, perfilAtivoId, 140);
      return r.ok ? r.value : [];
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage mensagem={t("erroCarregar")} onTentar={() => refetch()} />;
  }

  if (
    !visao ||
    (visao.totalDominados === 0 && visao.totalEmProgresso === 0 && visao.totalTentativas === 0)
  ) {
    return <EmptyState icone="📊" titulo={t("semDados")} descricao={t("semDadosDescricao")} />;
  }

  const abas: { id: AbaAtiva; label: string }[] = [
    { id: "visao-geral", label: "Visão Geral" },
    { id: "historico", label: "Histórico" },
    { id: "pontos-fracos", label: "Pontos Fracos" },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold text-[var(--color-conteudo-primario)]">{t("titulo")}</h1>

      <div className="grid grid-cols-4 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-[var(--color-acento)]">
            {visao.totalDominados + visao.totalEmProgresso}
          </p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Vistos</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-500">{visao.totalDominados}</p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Dominados</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-yellow-500">{visao.totalEmProgresso}</p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Em progresso</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-[var(--color-conteudo-primario)]">
            {visao.taxaAcerto}%
          </p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Precisão</p>
        </Card>
      </div>

      <nav
        className="flex gap-1 border-b border-[var(--color-borda)]"
        aria-label="Abas de estatísticas"
      >
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            aria-selected={aba === a.id}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              aba === a.id
                ? "border-[var(--color-acento)] text-[var(--color-acento)]"
                : "border-transparent text-[var(--color-conteudo-secundario)] hover:text-[var(--color-conteudo-primario)]"
            }`}
          >
            {a.label}
          </button>
        ))}
      </nav>

      {aba === "visao-geral" && (
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-[var(--color-conteudo-primario)]">
              Atividade — últimas 20 semanas
            </h2>
            <Heatmap dados={heatmap ?? []} semanas={20} />
          </Card>
        </div>
      )}

      {aba === "pontos-fracos" && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-conteudo-primario)]">
            Exercícios com menor precisão
          </h2>
          <PontosFracos />
        </Card>
      )}

      {aba === "historico" && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-conteudo-primario)]">
            Histórico de sessões
          </h2>
          <HistoricoSessoes />
        </Card>
      )}
    </div>
  );
}
