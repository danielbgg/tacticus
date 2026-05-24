import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDb } from "@/db/schema";
import { buscarHistoricoSessoes } from "@/db/queries/estatisticas";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import { Button } from "@/shared/components/Button/Button";
import type { HistoricoSessao } from "@/db/queries/estatisticas";

const POR_PAGINA = 20;

const MODO_LABEL: Record<string, string> = {
  treino: "Treino",
  revisao: "Revisão",
  livre: "Livre",
};

function formatarDuracao(ms: number | null): string {
  if (!ms) return "—";
  const min = Math.floor(ms / 60000);
  const seg = Math.floor((ms % 60000) / 1000);
  return `${min}m ${seg}s`;
}

export function HistoricoSessoes() {
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);
  const [pagina, setPagina] = useState(0);

  const { data: sessoes, isLoading } = useQuery({
    queryKey: ["historico-sessoes", perfilAtivoId],
    enabled: !!perfilAtivoId,
    queryFn: async () => {
      if (!perfilAtivoId) return [];
      const db = await getDb();
      const r = await buscarHistoricoSessoes(db as never, perfilAtivoId, 200);
      return r.ok ? r.value : [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!sessoes || sessoes.length === 0) {
    return (
      <p className="text-sm text-center text-[var(--color-conteudo-terciario)] py-8">
        Nenhuma sessão registrada ainda.
      </p>
    );
  }

  const inicio = pagina * POR_PAGINA;
  const pagina_atual = sessoes.slice(inicio, inicio + POR_PAGINA);
  const totalPaginas = Math.ceil(sessoes.length / POR_PAGINA);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="text-left text-xs text-[var(--color-conteudo-terciario)] border-b border-[var(--color-borda)]">
              <th className="pb-2 font-medium">Data</th>
              <th className="pb-2 font-medium">Modo</th>
              <th className="pb-2 font-medium text-right">Tentativas</th>
              <th className="pb-2 font-medium text-right">Acertos</th>
              <th className="pb-2 font-medium text-right">Precisão</th>
              <th className="pb-2 font-medium text-right">Duração</th>
            </tr>
          </thead>
          <tbody>
            {pagina_atual.map((s: HistoricoSessao) => {
              const taxa =
                s.totalTentativas > 0 ? Math.round((s.totalAcertos / s.totalTentativas) * 100) : 0;
              return (
                <tr
                  key={s.id}
                  className="border-b border-[var(--color-borda)]/50 hover:bg-[var(--color-superficie-secundaria)] transition-colors"
                >
                  <td className="py-2 text-[var(--color-conteudo-secundario)]">
                    <div>
                      {s.inicio.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-[var(--color-conteudo-terciario)]">
                      {s.inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </td>
                  <td className="py-2">
                    <span className="rounded-full bg-[var(--color-acento)]/10 px-2 py-0.5 text-xs text-[var(--color-acento)]">
                      {MODO_LABEL[s.modo] ?? s.modo}
                    </span>
                  </td>
                  <td className="py-2 text-right text-[var(--color-conteudo-secundario)]">
                    {s.totalTentativas}
                  </td>
                  <td className="py-2 text-right text-green-500">{s.totalAcertos}</td>
                  <td
                    className={`py-2 text-right font-medium ${taxa >= 70 ? "text-green-500" : taxa >= 50 ? "text-yellow-500" : "text-red-400"}`}
                  >
                    {taxa}%
                  </td>
                  <td className="py-2 text-right text-[var(--color-conteudo-terciario)]">
                    {formatarDuracao(s.duracaoMs)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPagina((p) => p - 1)}
            disabled={pagina === 0}
          >
            ← Anterior
          </Button>
          <span className="text-sm text-[var(--color-conteudo-terciario)]">
            {pagina + 1} / {totalPaginas}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPagina((p) => p + 1)}
            disabled={pagina >= totalPaginas - 1}
          >
            Próxima →
          </Button>
        </div>
      )}
    </div>
  );
}
