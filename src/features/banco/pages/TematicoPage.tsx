import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/shared/components/Card/Card";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import { ErrorMessage } from "@/shared/components/ErrorMessage/ErrorMessage";
import { Progress } from "@/shared/components/Progress/Progress";
import { getDb } from "@/db/schema";
import { listarAreas, listarModulosArea, listarUnidadesModulo } from "@/db/queries/estrutura";
import { listarProgressoAgrupadoPorUnidade } from "@/db/queries/progresso";
import type { ProgressoUnidade } from "@/db/queries/progresso";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import type { Area, Modulo } from "@/shared/types/domain";

const AREA_CIRCULOS_ID = "area-circulos";

export function TematicoPage() {
  const navigate = useNavigate();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);

  type FiltroStatus = "todas" | "nao_iniciadas" | "em_progresso" | "concluidas";
  const [areaAtiva, setAreaAtiva] = useState<Area | null>(null);
  const [moduloAtivo, setModuloAtivo] = useState<Modulo | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todas");

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

  const areasTemáticas = todasAreas?.filter((a) => a.id !== AREA_CIRCULOS_ID) ?? [];

  // Auto-seleciona a primeira área temática quando carregadas
  useEffect(() => {
    if (areasTemáticas.length > 0 && !areaAtiva) {
      setAreaAtiva(areasTemáticas[0]!);
    }
  }, [areasTemáticas, areaAtiva]);

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
    staleTime: 0,
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
        <Skeleton className="h-20 w-full rounded-2xl" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (erroAreas) {
    return (
      <ErrorMessage mensagem="Erro ao carregar os módulos temáticos." onTentar={() => refetch()} />
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2a3a] to-[#0f1a2a] border border-[#2a5060]/60 p-6">
        <div className="absolute top-0 right-0 w-48 h-48 opacity-5 text-[10rem] leading-none select-none pointer-events-none">
          ♞
        </div>
        <div className="relative">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
            Treino por Tema
          </span>
          <h1 className="text-xl font-bold text-white mt-1 mb-1">Treino Temático</h1>
          <p className="text-sm text-cyan-200/70 max-w-lg">
            17 temas táticos — Garfo, Cravada, Espeto, Mate em 1/2/3+, Padrões de Mate e mais.
            Exercícios exclusivos dos Círculos, ordenados por dificuldade crescente.
          </p>
          <div className="mt-3 flex gap-4 text-xs text-cyan-300/60">
            <span>17 módulos</span>
            <span>·</span>
            <span>867 unidades</span>
            <span>·</span>
            <span>12.138 exercícios</span>
          </div>
        </div>
      </div>

      {/* Seletor de área (caso haja mais de uma) */}
      {areasTemáticas.length > 1 && (
        <nav className="flex flex-wrap gap-2" aria-label="Áreas temáticas">
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
      )}

      {/* Lista de módulos */}
      {areaAtiva && (
        <>
          {carregandoModulos ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {modulos?.map((modulo) => (
                <Card
                  key={modulo.id}
                  interactive
                  onClick={() => setModuloAtivo(moduloAtivo?.id === modulo.id ? null : modulo)}
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

      {/* Lista de unidades do módulo selecionado */}
      {moduloAtivo && (
        <>
          <div className="flex items-center justify-between -mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-conteudo-secundario)]">
              {moduloAtivo.nome} — Unidades
            </h2>
            <div className="flex gap-1">
              {(
                [
                  { valor: "todas", label: "Todas" },
                  { valor: "nao_iniciadas", label: "Novas" },
                  { valor: "em_progresso", label: "Em andamento" },
                  { valor: "concluidas", label: "Concluídas" },
                ] as { valor: FiltroStatus; label: string }[]
              ).map((f) => (
                <button
                  key={f.valor}
                  onClick={() => setFiltroStatus(f.valor)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    filtroStatus === f.valor
                      ? "bg-[var(--color-acento)] text-white"
                      : "bg-[var(--color-superficie-secundaria)] text-[var(--color-conteudo-secundario)] hover:bg-[var(--color-borda)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {carregandoUnidades ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {unidades
                ?.filter((unidade) => {
                  const prog = progressoUnidades?.find((p) => p.unidadeId === unidade.id);
                  const tentados = prog?.tentados ?? 0;
                  const total = unidade.totalExercicios;
                  const concluida = tentados >= total && total > 0;
                  const emProgresso = tentados > 0 && !concluida;
                  const naoIniciada = tentados === 0;
                  if (filtroStatus === "todas") return true;
                  if (filtroStatus === "nao_iniciadas") return naoIniciada;
                  if (filtroStatus === "em_progresso") return emProgresso;
                  if (filtroStatus === "concluidas") return concluida;
                  return true;
                })
                .map((unidade) => {
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
    </div>
  );
}
