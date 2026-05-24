import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import { EmptyState } from "@/shared/components/EmptyState/EmptyState";
import { ErrorMessage } from "@/shared/components/ErrorMessage/ErrorMessage";
import type { Exercicio } from "@/shared/types/domain";

interface Filtros {
  jogador?: string;
  eco?: string;
  ano?: { min: number; max: number };
}

interface ExercicioListProps {
  exercicios: Exercicio[];
  isLoading: boolean;
  isError: boolean;
  onSelecionar: (exercicio: Exercicio) => void;
}

export function ExercicioList({
  exercicios,
  isLoading,
  isError,
  onSelecionar,
}: ExercicioListProps) {
  const { t } = useTranslation("banco");
  const [filtros, setFiltros] = useState<Filtros>({});
  const [pagina, setPagina] = useState(0);
  const POR_PAGINA = 50;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage mensagem={t("erroCarregar")} />;
  }

  const filtrados = exercicios.filter((ex) => {
    if (filtros.jogador) {
      const j = filtros.jogador.toLowerCase();
      const brancas = ex.partida.brancas?.toLowerCase() ?? "";
      const negras = ex.partida.negras?.toLowerCase() ?? "";
      if (!brancas.includes(j) && !negras.includes(j)) return false;
    }
    if (filtros.eco && ex.partida.eco) {
      if (!ex.partida.eco.toLowerCase().includes(filtros.eco.toLowerCase())) return false;
    }
    if (filtros.ano) {
      const ano = ex.partida.ano;
      if (ano && (ano < filtros.ano.min || ano > filtros.ano.max)) return false;
    }
    return true;
  });

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const visiveis = filtrados.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Jogador..."
          value={filtros.jogador ?? ""}
          onChange={(e) => {
            setFiltros((f) => {
              const { jogador: _j, ...rest } = f;
              return e.target.value ? { ...rest, jogador: e.target.value } : rest;
            });
            setPagina(0);
          }}
          className="rounded-lg border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] px-3 py-1.5 text-sm text-[var(--color-conteudo-primario)] placeholder:text-[var(--color-conteudo-terciario)] focus:outline-none focus:ring-2 focus:ring-[var(--color-acento)]"
        />
        <input
          type="text"
          placeholder="ECO (ex: B20)"
          value={filtros.eco ?? ""}
          onChange={(e) => {
            setFiltros((f) => {
              const { eco: _e, ...rest } = f;
              return e.target.value ? { ...rest, eco: e.target.value } : rest;
            });
            setPagina(0);
          }}
          className="w-28 rounded-lg border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] px-3 py-1.5 text-sm text-[var(--color-conteudo-primario)] placeholder:text-[var(--color-conteudo-terciario)] focus:outline-none focus:ring-2 focus:ring-[var(--color-acento)]"
        />
        {(filtros.jogador ?? filtros.eco) && (
          <button
            onClick={() => {
              setFiltros({});
              setPagina(0);
            }}
            className="rounded-lg px-3 py-1.5 text-sm text-[var(--color-conteudo-terciario)] hover:text-[var(--color-conteudo-primario)]"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Lista */}
      {visiveis.length === 0 ? (
        <EmptyState titulo="Nenhum exercício encontrado" descricao="Tente ajustar os filtros" />
      ) : (
        <div
          className="divide-y divide-[var(--color-borda)] rounded-xl border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] overflow-hidden"
          role="list"
        >
          {visiveis.map((ex) => (
            <button
              key={ex.id}
              role="listitem"
              onClick={() => onSelecionar(ex)}
              className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-[var(--color-superficie-secundaria)] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-[var(--color-conteudo-primario)]">
                  {ex.partida.brancas ?? "?"} vs {ex.partida.negras ?? "?"}
                </p>
                <p className="truncate text-xs text-[var(--color-conteudo-terciario)]">
                  {ex.partida.evento ?? "—"} · {ex.partida.ano ?? "—"} · ECO:{" "}
                  {ex.partida.eco ?? "—"}
                </p>
              </div>
              <span className="shrink-0 rounded bg-[var(--color-superficie-secundaria)] px-2 py-0.5 text-xs text-[var(--color-conteudo-terciario)]">
                {ex.tipo}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--color-conteudo-terciario)]">
          <span>
            {pagina * POR_PAGINA + 1}–{Math.min((pagina + 1) * POR_PAGINA, filtrados.length)} de{" "}
            {filtrados.length}
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagina === 0}
              onClick={() => setPagina((p) => p - 1)}
              className="rounded px-2 py-1 hover:bg-[var(--color-superficie-secundaria)] disabled:opacity-40"
            >
              ‹
            </button>
            <button
              disabled={pagina >= totalPaginas - 1}
              onClick={() => setPagina((p) => p + 1)}
              className="rounded px-2 py-1 hover:bg-[var(--color-superficie-secundaria)] disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
