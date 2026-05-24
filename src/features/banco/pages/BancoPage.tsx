import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/Card/Card";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import { ErrorMessage } from "@/shared/components/ErrorMessage/ErrorMessage";
import { Progress } from "@/shared/components/Progress/Progress";
import { getDb } from "@/db/schema";
import { listarAreas, listarModulosArea, listarUnidadesModulo } from "@/db/queries/estrutura";
import { listarProgressoPerfil } from "@/db/queries/progresso";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import type { Area, Modulo } from "@/shared/types/domain";

export function BancoPage() {
  const { t } = useTranslation("banco");
  const navigate = useNavigate();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);
  const [areaAtiva, setAreaAtiva] = useState<Area | null>(null);
  const [moduloAtivo, setModuloAtivo] = useState<Modulo | null>(null);

  const {
    data: areas,
    isLoading: carregandoAreas,
    isError: erroAreas,
    refetch,
  } = useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      const db = await getDb();
      const r = await listarAreas(db as never);
      if (!r.ok) throw new Error(r.error);
      return r.value;
    },
  });

  const { data: modulos, isLoading: carregandoModulos } = useQuery({
    queryKey: ["modulos", areaAtiva?.id],
    enabled: !!areaAtiva,
    queryFn: async () => {
      if (!areaAtiva) return [];
      const db = await getDb();
      const r = await listarModulosArea(db as never, areaAtiva.id);
      if (!r.ok) throw new Error(r.error);
      return r.value;
    },
  });

  const { data: unidades, isLoading: carregandoUnidades } = useQuery({
    queryKey: ["unidades", moduloAtivo?.id],
    enabled: !!moduloAtivo,
    queryFn: async () => {
      if (!moduloAtivo) return [];
      const db = await getDb();
      const r = await listarUnidadesModulo(db as never, moduloAtivo.id);
      if (!r.ok) throw new Error(r.error);
      return r.value;
    },
  });

  const { data: progresso } = useQuery({
    queryKey: ["progresso", perfilAtivoId],
    enabled: !!perfilAtivoId,
    queryFn: async () => {
      if (!perfilAtivoId) return [];
      const db = await getDb();
      const r = await listarProgressoPerfil(db as never, perfilAtivoId);
      return r.ok ? r.value : [];
    },
  });

  function progressoUnidade(unidadeId: string) {
    if (!progresso) return 0;
    const dominados = progresso.filter(
      (p) => p.exercicioId.includes(unidadeId) && p.status === "dominado",
    ).length;
    return dominados;
  }

  if (carregandoAreas) {
    return (
      <div className="p-6 flex flex-col gap-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (erroAreas) {
    return <ErrorMessage mensagem={t("erroCarregar")} onTentar={() => refetch()} />;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="mb-6 text-xl font-bold text-[var(--color-conteudo-primario)]">
        {t("titulo")}
      </h1>

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Áreas de conteúdo">
        {areas?.map((area) => (
          <button
            key={area.id}
            onClick={() => {
              setAreaAtiva(area);
              setModuloAtivo(null);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              areaAtiva?.id === area.id
                ? "bg-[var(--color-acento)] text-white"
                : "bg-[var(--color-superficie-secundaria)] text-[var(--color-conteudo-secundario)] hover:bg-[var(--color-borda)]"
            }`}
            aria-pressed={areaAtiva?.id === area.id}
          >
            {area.nome}
          </button>
        ))}
      </nav>

      {areaAtiva && (
        <>
          {carregandoModulos ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="mb-4 flex flex-col gap-2">
              {modulos?.map((modulo) => (
                <Card
                  key={modulo.id}
                  interactive
                  onClick={() => setModuloAtivo(modulo)}
                  className={`flex items-center justify-between ${moduloAtivo?.id === modulo.id ? "border-[var(--color-acento)]" : ""}`}
                >
                  <span className="font-medium text-[var(--color-conteudo-primario)]">
                    {modulo.nome}
                  </span>
                  <span className="text-[var(--color-conteudo-terciario)] text-lg">›</span>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {moduloAtivo && (
        <>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-conteudo-secundario)]">
            {moduloAtivo.nome} — Unidades
          </h2>
          {carregandoUnidades ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {unidades?.map((unidade) => {
                const dominados = progressoUnidade(unidade.id);
                const pct =
                  unidade.totalExercicios > 0
                    ? Math.round((dominados / unidade.totalExercicios) * 100)
                    : 0;

                return (
                  <Card
                    key={unidade.id}
                    interactive
                    onClick={() =>
                      navigate({ to: "/treinar/$unidadeId", params: { unidadeId: unidade.id } })
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--color-conteudo-primario)]">
                        {unidade.nome}
                      </span>
                      <span className="text-sm text-[var(--color-conteudo-secundario)]">
                        {dominados}/{unidade.totalExercicios}
                      </span>
                    </div>
                    <Progress value={pct} label={`Progresso da unidade ${unidade.nome}`} />
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {!areaAtiva && (
        <p className="text-center text-[var(--color-conteudo-secundario)] py-12">
          {t("selecioneArea")}
        </p>
      )}
    </div>
  );
}
