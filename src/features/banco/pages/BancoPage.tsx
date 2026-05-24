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
import { listarProgressoAgrupadoPorUnidade } from "@/db/queries/progresso";
import type { ProgressoUnidade } from "@/db/queries/progresso";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import type { Area, Modulo, Unidade } from "@/shared/types/domain";

const AREA_CIRCULOS_ID = "area-circulos";

const DESCRICAO_MODULO: Record<string, string> = {
  "circles-mod-1": "400–800",
  "circles-mod-2": "800–1050",
  "circles-mod-3": "1050–1300",
  "circles-mod-4": "1300–1500",
  "circles-mod-5": "1500–1800",
  "circles-mod-6": "1800–2600",
};

export function BancoPage() {
  const { t } = useTranslation("banco");
  const navigate = useNavigate();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);

  // Círculos
  const [moduloCirculos, setModuloCirculos] = useState<Modulo | null>(null);

  // Temático
  const [areaAtiva, setAreaAtiva] = useState<Area | null>(null);
  const [moduloAtivo, setModuloAtivo] = useState<Modulo | null>(null);

  const {
    data: todasAreas,
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

  const areaCirculos = todasAreas?.find((a) => a.id === AREA_CIRCULOS_ID) ?? null;
  const areasTemáticas = todasAreas?.filter((a) => a.id !== AREA_CIRCULOS_ID) ?? [];

  const { data: modulosCirculos, isLoading: carregandoModulosCirculos } = useQuery({
    queryKey: ["modulos", AREA_CIRCULOS_ID],
    enabled: !!areaCirculos,
    queryFn: async () => {
      const db = await getDb();
      const r = await listarModulosArea(db as never, AREA_CIRCULOS_ID as never);
      return r.ok ? r.value : [];
    },
  });

  const { data: unidadesCirculos, isLoading: carregandoUnidadesCirculos } = useQuery({
    queryKey: ["unidades", moduloCirculos?.id],
    enabled: !!moduloCirculos,
    queryFn: async () => {
      if (!moduloCirculos) return [];
      const db = await getDb();
      const r = await listarUnidadesModulo(db as never, moduloCirculos.id);
      return r.ok ? r.value : [];
    },
  });

  const { data: modulos, isLoading: carregandoModulos } = useQuery({
    queryKey: ["modulos", areaAtiva?.id],
    enabled: !!areaAtiva,
    queryFn: async () => {
      if (!areaAtiva) return [];
      const db = await getDb();
      const r = await listarModulosArea(db as never, areaAtiva.id);
      return r.ok ? r.value : [];
    },
  });

  const { data: unidades, isLoading: carregandoUnidades } = useQuery({
    queryKey: ["unidades", moduloAtivo?.id],
    enabled: !!moduloAtivo,
    queryFn: async () => {
      if (!moduloAtivo) return [];
      const db = await getDb();
      const r = await listarUnidadesModulo(db as never, moduloAtivo.id);
      return r.ok ? r.value : [];
    },
  });

  const { data: progressoUnidades } = useQuery({
    queryKey: ["progresso-unidades", perfilAtivoId],
    enabled: !!perfilAtivoId,
    queryFn: async () => {
      if (!perfilAtivoId) return [] as ProgressoUnidade[];
      const db = await getDb();
      const r = await listarProgressoAgrupadoPorUnidade(db as never, perfilAtivoId);
      return r.ok ? r.value : [];
    },
  });

  function progressoUnidade(unidadeId: string) {
    const p = progressoUnidades?.find((u) => u.unidadeId === unidadeId);
    return { dominados: p?.dominados ?? 0 };
  }

  if (carregandoAreas) {
    return (
      <div className="p-6 flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-40 w-full rounded-2xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (erroAreas) {
    return <ErrorMessage mensagem={t("erroCarregar")} onTentar={() => refetch()} />;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-8">
      {/* ── Círculos de Treino ──────────────────────────────────────────── */}
      {areaCirculos && (
        <section>
          {/* Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2a4a] to-[#0f172a] border border-[#2a4080]/60 p-6 mb-4">
            <div className="absolute top-0 right-0 w-48 h-48 opacity-5 text-[10rem] leading-none select-none pointer-events-none">
              ♟
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Método PCT
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{areaCirculos.nome}</h2>
              <p className="text-sm text-blue-200/70 max-w-lg">{areaCirculos.descricao}</p>
              <div className="mt-3 flex gap-4 text-xs text-blue-300/60">
                <span>6 módulos</span>
                <span>·</span>
                <span>306 unidades</span>
                <span>·</span>
                <span>4.284 exercícios</span>
              </div>
            </div>
          </div>

          {/* Grid de módulos */}
          {carregandoModulosCirculos ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {modulosCirculos?.map((mod) => {
                const isAtivo = moduloCirculos?.id === mod.id;
                const ratingRange = DESCRICAO_MODULO[mod.id] ?? "";
                return (
                  <button
                    key={mod.id}
                    onClick={() => setModuloCirculos(isAtivo ? null : mod)}
                    className={`text-left rounded-xl border p-4 transition-all ${
                      isAtivo
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-[var(--color-borda)] bg-[var(--color-superficie)] hover:border-blue-500/50 hover:bg-blue-500/5"
                    }`}
                  >
                    <div className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">
                      {ratingRange}
                    </div>
                    <div className="text-sm font-semibold text-[var(--color-conteudo-primario)] leading-tight">
                      {mod.nome}
                    </div>
                    <div className="text-xs text-[var(--color-conteudo-terciario)] mt-1">
                      51 unidades · 714 exercícios
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Grid de unidades do módulo selecionado */}
          {moduloCirculos && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-conteudo-secundario)] mb-3">
                {moduloCirculos.nome} — selecione uma unidade
              </h3>
              {carregandoUnidadesCirculos ? (
                <div className="grid grid-cols-9 gap-1.5">
                  {Array.from({ length: 51 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-9 gap-1.5">
                  {unidadesCirculos?.map((unidade, idx) => {
                    const prog = progressoUnidades?.find((p) => p.unidadeId === unidade.id);
                    const concluida = prog && prog.dominados >= prog.total && prog.total > 0;
                    const emProgresso = prog && prog.dominados > 0 && !concluida;
                    return (
                      <button
                        key={unidade.id}
                        title={
                          concluida
                            ? `${unidade.nome} — Concluída`
                            : emProgresso
                              ? `${unidade.nome} — ${prog.dominados}/${prog.total}`
                              : unidade.nome
                        }
                        onClick={() =>
                          navigate({ to: "/treinar/$unidadeId", params: { unidadeId: unidade.id } })
                        }
                        className={`relative h-9 rounded-lg border text-xs font-semibold transition-colors ${
                          concluida
                            ? "border-green-500/60 bg-green-500/15 text-green-600 hover:border-green-400 hover:bg-green-500/25"
                            : emProgresso
                              ? "border-blue-500/40 bg-blue-500/8 text-blue-400 hover:border-blue-500 hover:bg-blue-500/15"
                              : "border-[var(--color-borda)] bg-[var(--color-superficie)] text-[var(--color-conteudo-secundario)] hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                        }`}
                      >
                        {concluida ? "✓" : idx + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── Treino Temático ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-conteudo-terciario)] mb-4">
          Treino Temático
        </h2>

        <nav className="mb-4 flex flex-wrap gap-2" aria-label="Áreas de conteúdo">
          {areasTemáticas.map((area) => (
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

        {!areaAtiva && (
          <p className="text-center text-[var(--color-conteudo-terciario)] py-8 text-sm">
            {t("selecioneArea")}
          </p>
        )}

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
                    className={`flex items-center justify-between ${
                      moduloAtivo?.id === modulo.id ? "border-[var(--color-acento)]" : ""
                    }`}
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
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-conteudo-secundario)]">
              {moduloAtivo.nome} — Unidades
            </h3>
            {carregandoUnidades ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {unidades?.map((unidade) => {
                  const { dominados } = progressoUnidade(unidade.id);
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
      </section>
    </div>
  );
}
