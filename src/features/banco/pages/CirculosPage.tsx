import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import { ErrorMessage } from "@/shared/components/ErrorMessage/ErrorMessage";
import { getDb } from "@/db/schema";
import { listarAreas, listarModulosArea, listarUnidadesModulo } from "@/db/queries/estrutura";
import { listarProgressoAgrupadoPorUnidade } from "@/db/queries/progresso";
import type { ProgressoUnidade } from "@/db/queries/progresso";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import type { Modulo } from "@/shared/types/domain";

const AREA_CIRCULOS_ID = "area-circulos";

const RATING_RANGE: Record<string, string> = {
  "circles-mod-1": "400–800",
  "circles-mod-2": "750–1050",
  "circles-mod-3": "1000–1300",
  "circles-mod-4": "1200–1500",
  "circles-mod-5": "1500–1700",
  "circles-mod-6": "1700–1900",
  "circles-mod-7": "1900–2100",
  "circles-mod-8": "2100–2300",
  "circles-mod-9": "2300–2500",
  "circles-mod-10": "2500+",
};

export function CirculosPage() {
  const navigate = useNavigate();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);
  const [moduloSelecionado, setModuloSelecionado] = useState<Modulo | null>(null);

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

  const areaCirculos = areas?.find((a) => a.id === AREA_CIRCULOS_ID) ?? null;

  const { data: modulos, isLoading: carregandoModulos } = useQuery({
    queryKey: ["modulos", AREA_CIRCULOS_ID],
    enabled: !!areaCirculos,
    queryFn: async () => {
      const db = await getDb();
      const r = await listarModulosArea(db as never, AREA_CIRCULOS_ID as never);
      return r.ok ? r.value : [];
    },
  });

  const { data: unidades, isLoading: carregandoUnidades } = useQuery({
    queryKey: ["unidades", moduloSelecionado?.id],
    enabled: !!moduloSelecionado,
    queryFn: async () => {
      if (!moduloSelecionado) return [];
      const db = await getDb();
      const r = await listarUnidadesModulo(db as never, moduloSelecionado.id);
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

  if (carregandoAreas) {
    return (
      <div className="p-6 flex flex-col gap-4" aria-busy="true">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (erroAreas) {
    return <ErrorMessage mensagem="Erro ao carregar os círculos." onTentar={() => refetch()} />;
  }

  const totalModulos = modulos?.length ?? 10;
  const totalUnidades = totalModulos * 51;
  const totalExercicios = totalModulos * 714;

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2a4a] to-[#0f172a] border border-[#2a4080]/60 p-6">
        <div className="absolute top-0 right-0 w-48 h-48 opacity-5 text-[10rem] leading-none select-none pointer-events-none">
          ♟
        </div>
        <div className="relative">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
            Método PCT
          </span>
          <h1 className="text-xl font-bold text-white mt-1 mb-1">
            {areaCirculos?.nome ?? "Círculos de Treino"}
          </h1>
          <p className="text-sm text-blue-200/70 max-w-lg">{areaCirculos?.descricao}</p>
          <div className="mt-3 flex gap-4 text-xs text-blue-300/60">
            <span>{totalModulos} círculos</span>
            <span>·</span>
            <span>{totalUnidades.toLocaleString("pt-BR")} unidades</span>
            <span>·</span>
            <span>{totalExercicios.toLocaleString("pt-BR")} exercícios</span>
          </div>
        </div>
      </div>

      {/* Grid de círculos */}
      {carregandoModulos ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {modulos?.map((mod) => {
            const isAtivo = moduloSelecionado?.id === mod.id;
            const rating = RATING_RANGE[mod.id] ?? "";
            return (
              <button
                key={mod.id}
                onClick={() => setModuloSelecionado(isAtivo ? null : mod)}
                className={`text-left rounded-xl border p-4 transition-all ${
                  isAtivo
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-[var(--color-borda)] bg-[var(--color-superficie)] hover:border-blue-500/50 hover:bg-blue-500/5"
                }`}
              >
                <div className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">
                  {rating}
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

      {/* Grid de unidades do círculo selecionado */}
      {moduloSelecionado && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-conteudo-secundario)] mb-3">
            {moduloSelecionado.nome} — selecione uma unidade
          </h2>
          {carregandoUnidades ? (
            <div className="grid grid-cols-9 gap-1.5">
              {Array.from({ length: 51 }).map((_, i) => (
                <Skeleton key={i} className="h-9 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-9 gap-1.5">
              {unidades?.map((unidade, idx) => {
                const prog = progressoUnidades?.find((p) => p.unidadeId === unidade.id);
                const concluida = prog && prog.tentados >= prog.total && prog.total > 0;
                const emProgresso = prog && prog.tentados > 0 && !concluida;
                return (
                  <button
                    key={unidade.id}
                    title={
                      concluida
                        ? `${unidade.nome} — Concluída`
                        : emProgresso
                          ? `${unidade.nome} — ${prog.tentados}/${prog.total}`
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
    </div>
  );
}
