import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/shared/components/Card/Card";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import { ErrorMessage } from "@/shared/components/ErrorMessage/ErrorMessage";
import { Progress } from "@/shared/components/Progress/Progress";
import { usePerfilAtivo } from "@/features/perfil/hooks/usePerfilAtivo";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { getDb } from "@/db/schema";
import { listarExerciciosParaRevisao, listarProgressoPerfil } from "@/db/queries/progresso";
import type { PerfilId } from "@/shared/types/branded";

interface UltimaUnidade {
  unidadeId: string;
  nomeUnidade: string;
  timestampUltima: string;
}

interface PontoFracoHome {
  unidadeId: string;
  nomeUnidade: string;
  taxaAcerto: number;
}

async function buscarUltimaUnidade(perfilId: PerfilId): Promise<UltimaUnidade | null> {
  const db = await getDb();

  // Unidade mais recente com status de conclusão
  const rows = await db.select<
    Array<{ unidade_id: string; nome_unidade: string; ts: string; total: number; tentados: number }>
  >(
    `SELECT u.id as unidade_id, u.nome as nome_unidade, MAX(t.timestamp) as ts,
            (SELECT COUNT(*) FROM exercicios WHERE unidade_id = u.id) as total,
            (SELECT COUNT(*) FROM progresso_exercicio pe2
             JOIN exercicios ex ON pe2.exercicio_id = ex.id
             WHERE ex.unidade_id = u.id AND pe2.perfil_id = ? AND pe2.total_tentativas > 0) as tentados
     FROM tentativas t
     JOIN exercicios e ON t.exercicio_id = e.id
     JOIN unidades u ON e.unidade_id = u.id
     WHERE t.perfil_id = ?
     GROUP BY u.id
     ORDER BY ts DESC
     LIMIT 1`,
    [perfilId, perfilId],
  );

  const r = rows[0];
  if (!r) return null;

  const completa = r.total > 0 && r.tentados >= r.total;
  if (!completa) {
    return { unidadeId: r.unidade_id, nomeUnidade: r.nome_unidade, timestampUltima: r.ts };
  }

  // Unidade concluída — buscar próxima não iniciada em ordem
  const proxima = await db.select<Array<{ id: string; nome: string }>>(
    `SELECT u.id, u.nome
     FROM unidades u
     JOIN modulos m ON u.modulo_id = m.id
     WHERE NOT EXISTS (
       SELECT 1 FROM tentativas t2
       JOIN exercicios e2 ON t2.exercicio_id = e2.id
       WHERE e2.unidade_id = u.id AND t2.perfil_id = ?
     )
     ORDER BY m.ordem ASC, u.ordem ASC
     LIMIT 1`,
    [perfilId],
  );

  if (proxima[0]) {
    return { unidadeId: proxima[0].id, nomeUnidade: proxima[0].nome, timestampUltima: r.ts };
  }

  // Todas as unidades foram iniciadas — não mostrar botão Continuar
  return null;
}

async function buscarStreak(perfilId: PerfilId): Promise<number> {
  const db = await getDb();
  const rows = await db.select<Array<{ data: string }>>(
    `SELECT DISTINCT DATE(inicio) as data
     FROM sessoes
     WHERE perfil_id = ?
     ORDER BY data DESC
     LIMIT 365`,
    [perfilId],
  );

  if (rows.length === 0) return 0;

  const hoje = new Date().toISOString().split("T")[0] ?? "";
  const ontem = new Date(Date.now() - 86400000).toISOString().split("T")[0] ?? "";

  const primeira = rows[0]?.data;
  if (primeira !== hoje && primeira !== ontem) return 0;

  let streak = 1;
  for (let i = 1; i < rows.length; i++) {
    const prevData = rows[i - 1]?.data;
    const currData = rows[i]?.data;
    if (!prevData || !currData) break;
    const anterior = new Date(prevData);
    const atual = new Date(currData);
    const diffDias = Math.round((anterior.getTime() - atual.getTime()) / 86400000);
    if (diffDias === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

async function buscarPontosFracosHome(perfilId: PerfilId): Promise<PontoFracoHome[]> {
  const db = await getDb();
  const rows = await db.select<
    Array<{ unidade_id: string; nome_unidade: string; taxa_acerto: number }>
  >(
    `SELECT e.unidade_id, u.nome as nome_unidade,
            CAST(SUM(CASE WHEN t.acertou = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(t.id) AS INTEGER) as taxa_acerto
     FROM tentativas t
     JOIN exercicios e ON t.exercicio_id = e.id
     JOIN unidades u ON e.unidade_id = u.id
     WHERE t.perfil_id = ?
     GROUP BY e.unidade_id
     HAVING COUNT(t.id) >= 5
       AND CAST(SUM(CASE WHEN t.acertou = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(t.id) AS INTEGER) < 85
     ORDER BY taxa_acerto ASC
     LIMIT 3`,
    [perfilId],
  );
  return rows.map((r) => ({
    unidadeId: r.unidade_id,
    nomeUnidade: r.nome_unidade,
    taxaAcerto: r.taxa_acerto,
  }));
}

export function HomePage() {
  const navigate = useNavigate();
  const { data: perfil, isLoading, isError } = usePerfilAtivo();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);

  const { data: revisoes } = useQuery({
    queryKey: ["revisoes", perfilAtivoId],
    enabled: !!perfilAtivoId,
    queryFn: async () => {
      if (!perfilAtivoId) return [];
      const db = await getDb();
      const r = await listarExerciciosParaRevisao(db as never, perfilAtivoId);
      return r.ok ? r.value : [];
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

  const { data: ultimaUnidade } = useQuery({
    queryKey: ["ultima-unidade", perfilAtivoId],
    enabled: !!perfilAtivoId,
    queryFn: () => (perfilAtivoId ? buscarUltimaUnidade(perfilAtivoId) : null),
  });

  const { data: streak = 0 } = useQuery({
    queryKey: ["streak", perfilAtivoId],
    enabled: !!perfilAtivoId,
    queryFn: () => (perfilAtivoId ? buscarStreak(perfilAtivoId) : 0),
  });

  const { data: pontosFracos = [] } = useQuery({
    queryKey: ["pontos-fracos-home", perfilAtivoId],
    enabled: !!perfilAtivoId,
    queryFn: () => (perfilAtivoId ? buscarPontosFracosHome(perfilAtivoId) : []),
  });

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col gap-6" aria-busy="true">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage mensagem="Erro ao carregar perfil" />;
  }

  const totalDominados = progresso?.filter((p) => p.status === "dominado").length ?? 0;
  const totalVistos = progresso?.filter((p) => p.status !== "nao_visto").length ?? 0;
  const totalProgresso = progresso?.length ?? 0;
  const totalRevisoes = revisoes?.length ?? 0;
  const percentualGeral =
    totalProgresso > 0 ? Math.round((totalDominados / totalProgresso) * 100) : 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-conteudo-primario)]">
            Olá, {perfil?.nome ?? "jogador"} {perfil?.avatar}
          </h1>
          <p className="text-sm text-[var(--color-conteudo-secundario)] capitalize">
            {perfil?.nivel}
          </p>
        </div>
        {streak > 0 && (
          <div className="flex flex-col items-center rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-2">
            <span className="text-2xl" aria-hidden="true">
              🔥
            </span>
            <span className="text-lg font-bold text-orange-500">{streak}</span>
            <span className="text-xs text-orange-400">dias</span>
          </div>
        )}
      </header>

      {/* Hero CTA — Continuar de onde parou */}
      {ultimaUnidade && (
        <div
          role="button"
          tabIndex={0}
          onClick={() =>
            navigate({
              to: "/treinar/$unidadeId",
              params: { unidadeId: ultimaUnidade.unidadeId },
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              navigate({
                to: "/treinar/$unidadeId",
                params: { unidadeId: ultimaUnidade.unidadeId },
              });
          }}
          className="cursor-pointer rounded-2xl bg-[var(--color-acento)] p-5 flex items-center gap-5 hover:opacity-90 active:opacity-80 transition-opacity"
        >
          <span className="text-5xl shrink-0 text-white" aria-hidden="true">
            ▶
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-white/70">
              Continuar de onde parei
            </p>
            <p className="truncate text-xl font-bold text-white mt-0.5">
              {ultimaUnidade.nomeUnidade}
            </p>
            <p className="text-xs text-white/60 mt-1">
              Última sessão: {new Date(ultimaUnidade.timestampUltima).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      )}

      {/* Barra de progresso geral */}
      {totalProgresso > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-[var(--color-conteudo-terciario)]">
            <span>Progresso geral</span>
            <span>
              {totalDominados} / {totalProgresso} dominados
            </span>
          </div>
          <Progress value={percentualGeral} label="Progresso geral" />
        </div>
      )}

      {/* Cards de stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-[var(--color-acento)]">{totalVistos}</p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Vistos</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-[var(--color-sucesso)]">{totalDominados}</p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Dominados</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-[var(--color-aviso)]">{totalRevisoes}</p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Para revisão</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-2xl font-bold text-[var(--color-conteudo-primario)]">
            {percentualGeral}%
          </p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Domínio</p>
        </Card>
      </div>

      {/* Card "Revisar" — revisões pendentes */}
      {totalRevisoes > 0 && (
        <button
          onClick={() => navigate({ to: "/revisao" })}
          className="w-full rounded-xl border-2 border-[var(--color-acento)] bg-[var(--color-acento)]/5 p-4 text-left transition-colors hover:bg-[var(--color-acento)]/10"
        >
          <p className="font-semibold text-[var(--color-acento)]">
            {totalRevisoes} exercício{totalRevisoes > 1 ? "s" : ""} para revisão
          </p>
          <p className="text-sm text-[var(--color-conteudo-secundario)]">
            Revise agora para manter o progresso
          </p>
        </button>
      )}

      {/* Pontos fracos */}
      {pontosFracos.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-conteudo-secundario)]">
            Pontos a melhorar
          </h2>
          <div className="space-y-2">
            {pontosFracos.map((pf) => (
              <div
                key={pf.unidadeId}
                className="flex items-center gap-3 rounded-lg bg-[var(--color-superficie-secundaria)] px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--color-conteudo-primario)]">
                    {pf.nomeUnidade}
                  </p>
                  <div className="mt-1">
                    <Progress value={pf.taxaAcerto} label={`Taxa de acerto: ${pf.taxaAcerto}%`} />
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold text-[var(--color-erro)]">
                  {pf.taxaAcerto}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navegação */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card
          interactive
          onClick={() => navigate({ to: "/banco" })}
          className="flex items-center gap-3"
        >
          <span className="text-3xl shrink-0" aria-hidden="true">
            📚
          </span>
          <div>
            <p className="font-semibold text-[var(--color-conteudo-primario)]">
              Banco de Exercícios
            </p>
            <p className="text-sm text-[var(--color-conteudo-secundario)]">
              Escolha uma unidade para treinar
            </p>
          </div>
        </Card>

        <Card
          interactive
          onClick={() => navigate({ to: "/estatisticas" })}
          className="flex items-center gap-3"
        >
          <span className="text-3xl shrink-0" aria-hidden="true">
            📈
          </span>
          <div>
            <p className="font-semibold text-[var(--color-conteudo-primario)]">Estatísticas</p>
            <p className="text-sm text-[var(--color-conteudo-secundario)]">
              Veja seu progresso detalhado
            </p>
          </div>
        </Card>

        <Card
          interactive
          onClick={() => navigate({ to: "/configuracoes" })}
          className="flex items-center gap-3"
        >
          <span className="text-3xl shrink-0" aria-hidden="true">
            ⚙️
          </span>
          <div>
            <p className="font-semibold text-[var(--color-conteudo-primario)]">Configurações</p>
            <p className="text-sm text-[var(--color-conteudo-secundario)]">
              Tema, tabuleiro e preferências
            </p>
          </div>
        </Card>

        <Card interactive onClick={() => navigate({ to: "/" })} className="flex items-center gap-3">
          <span className="text-3xl shrink-0" aria-hidden="true">
            👤
          </span>
          <div>
            <p className="font-semibold text-[var(--color-conteudo-primario)]">Trocar Perfil</p>
            <p className="text-sm text-[var(--color-conteudo-secundario)]">
              Selecione outro perfil
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
