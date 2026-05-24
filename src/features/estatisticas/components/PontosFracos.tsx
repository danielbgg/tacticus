import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDb } from "@/db/schema";
import { buscarPontosFracos } from "@/db/queries/estatisticas";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";

export function PontosFracos() {
  const navigate = useNavigate();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);

  const { data: fracos, isLoading } = useQuery({
    queryKey: ["pontos-fracos", perfilAtivoId],
    enabled: !!perfilAtivoId,
    queryFn: async () => {
      if (!perfilAtivoId) return [];
      const db = await getDb();
      const r = await buscarPontosFracos(db as never, perfilAtivoId, 5);
      return r.ok ? r.value : [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!fracos || fracos.length === 0) {
    return (
      <p className="text-sm text-[var(--color-conteudo-terciario)] text-center py-4">
        Sem pontos fracos identificados ainda. Continue treinando!
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2" role="list">
      {fracos.map((f) => (
        <li
          key={f.unidadeId}
          className="flex items-center justify-between rounded-lg border border-[var(--color-borda)] p-3"
        >
          <div>
            <p className="text-sm font-medium text-[var(--color-conteudo-primario)]">
              {f.nomeUnidade}
            </p>
            <p className="text-xs text-[var(--color-conteudo-terciario)]">
              {f.totalTentativas} tentativas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-bold ${f.taxaAcerto < 40 ? "text-red-500" : "text-orange-400"}`}
            >
              {f.taxaAcerto}%
            </span>
            <button
              onClick={() =>
                navigate({ to: "/treinar/$unidadeId", params: { unidadeId: f.unidadeId } })
              }
              className="rounded-md bg-[var(--color-acento)]/10 px-2 py-1 text-xs font-medium text-[var(--color-acento)] hover:bg-[var(--color-acento)]/20 transition-colors"
            >
              Treinar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
