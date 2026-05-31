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

async function buscarAcertosHoje(perfilId: PerfilId): Promise<number> {
  const db = await getDb();
  const hoje = new Date().toISOString().split("T")[0]!;
  const rows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM tentativas WHERE perfil_id = ? AND DATE(timestamp) = ? AND acertou = 1`,
    [perfilId, hoje],
  );
  return rows[0]?.count ?? 0;
}

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

  const metaDiaria = usePerfilStore((s) => s.configuracoes?.metaDiaria ?? 0);

  const { data: acertosHoje = 0 } = useQuery({
    queryKey: ["acertos-hoje", perfilAtivoId],
    enabled: !!perfilAtivoId && metaDiaria > 0,
    queryFn: () => (perfilAtivoId ? buscarAcertosHoje(perfilAtivoId) : 0),
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
    <div className="flex flex-col min-h-full">
      {/* Hero banner — gradiente com marca d'água de peça */}
      <div
        className="relative overflow-hidden px-6 py-7 shrink-0"
        style={{
          background:
            "linear-gradient(135deg, var(--color-superficie-primaria) 0%, var(--color-superficie-secundaria) 100%)",
          borderBottom: "1px solid var(--color-borda)",
        }}
      >
        {/* Peça decorativa em marca d'água */}
        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 select-none pointer-events-none leading-none"
          style={{
            fontSize: "7rem",
            opacity: 0.06,
            color: "var(--color-acento)",
            fontFamily: "serif",
          }}
          aria-hidden="true"
        >
          ♛
        </span>

        <div className="relative flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "var(--color-conteudo-terciario)" }}
            >
              Bem-vindo de volta
            </p>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-conteudo-primario)" }}>
              {perfil?.avatar} {perfil?.nome ?? "Jogador"}
            </h1>
            <p
              className="text-sm mt-0.5 capitalize"
              style={{ color: "var(--color-conteudo-secundario)" }}
            >
              {perfil?.nivel}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* ELO badge premium */}
            {perfil?.eloTatico != null && (
              <div
                className="flex flex-col items-center px-4 py-2.5 rounded-lg"
                style={{
                  background: "var(--color-superficie-secundaria)",
                  border: "1px solid var(--color-acento)",
                  boxShadow: "var(--shadow-gold)",
                }}
              >
                <span
                  className="text-2xl font-bold tabular-nums leading-none"
                  style={{ color: "var(--color-acento)" }}
                >
                  {perfil.eloTatico}
                </span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                  style={{ color: "var(--color-conteudo-terciario)" }}
                >
                  ELO
                </span>
              </div>
            )}

            {/* Streak badge */}
            {streak > 0 && (
              <div
                className="flex flex-col items-center px-3 py-2.5 rounded-lg"
                style={{
                  background: "rgba(251,146,60,0.10)",
                  border: "1px solid rgba(251,146,60,0.30)",
                }}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  🔥
                </span>
                <span className="text-base font-bold text-orange-400 leading-tight">{streak}</span>
                <span className="text-[10px] text-orange-400/70 font-medium">dias</span>
              </div>
            )}
          </div>
        </div>

        {/* Barra de progresso geral inline */}
        {totalProgresso > 0 && (
          <div className="relative max-w-3xl mx-auto mt-4">
            <div
              className="flex justify-between text-[11px] mb-1"
              style={{ color: "var(--color-conteudo-terciario)" }}
            >
              <span>Progresso geral</span>
              <span>
                {totalDominados} / {totalProgresso} dominados · {percentualGeral}%
              </span>
            </div>
            <Progress value={percentualGeral} label="Progresso geral" />
          </div>
        )}
      </div>

      {/* Conteúdo principal */}
      <div className="p-6 max-w-3xl mx-auto w-full space-y-5 flex-1">
        {/* Meta diária (se configurada) */}
        {metaDiaria > 0 && (
          <div
            className="rounded-lg px-4 py-3 flex items-center gap-4"
            style={{
              background: "var(--color-superficie-primaria)",
              border: "1px solid var(--color-borda)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: "var(--color-conteudo-secundario)" }}>Meta do dia</span>
                <span className="font-semibold" style={{ color: "var(--color-conteudo-primario)" }}>
                  {Math.min(acertosHoje, metaDiaria)}/{metaDiaria} acertos
                </span>
              </div>
              <Progress
                value={metaDiaria > 0 ? Math.min((acertosHoje / metaDiaria) * 100, 100) : 0}
                label="Meta diária"
              />
            </div>
            {acertosHoje >= metaDiaria && (
              <span className="text-2xl shrink-0" aria-label="Meta atingida">
                ✓
              </span>
            )}
          </div>
        )}

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
            className="cursor-pointer rounded-xl p-5 flex items-center gap-5 transition-all duration-150 hover:-translate-y-px active:translate-y-0"
            style={{
              background:
                "linear-gradient(135deg, var(--color-acento) 0%, var(--color-acento-hover) 100%)",
              boxShadow: "var(--shadow-gold)",
            }}
          >
            <div
              className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <span className="text-2xl text-white" aria-hidden="true">
                ▶
              </span>
            </div>
            <div className="min-w-0">
              <p
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                Continuar de onde parei
              </p>
              <p className="truncate text-lg font-bold text-white mt-0.5">
                {ultimaUnidade.nomeUnidade}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                Última sessão: {new Date(ultimaUnidade.timestampUltima).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
        )}

        {/* Cards de stats — 4 colunas */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { valor: totalVistos, label: "Vistos", cor: "var(--color-acento)" },
            { valor: totalDominados, label: "Dominados", cor: "var(--color-sucesso)" },
            { valor: totalRevisoes, label: "Revisão", cor: "var(--color-aviso)" },
            {
              valor: `${percentualGeral}%`,
              label: "Domínio",
              cor: "var(--color-conteudo-primario)",
            },
          ].map(({ valor, label, cor }) => (
            <div
              key={label}
              className="rounded-lg p-3 text-center"
              style={{
                background: "var(--color-superficie-primaria)",
                border: "1px solid var(--color-borda)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <p className="text-xl font-bold leading-none" style={{ color: cor }}>
                {valor}
              </p>
              <p className="text-[11px] mt-1" style={{ color: "var(--color-conteudo-terciario)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Card "Revisar" — revisões pendentes */}
        {totalRevisoes > 0 && (
          <button
            onClick={() => navigate({ to: "/revisao" })}
            className="w-full rounded-lg p-4 text-left transition-all duration-150 hover:-translate-y-px"
            style={{
              background: "var(--color-superficie-primaria)",
              border: "1px solid var(--color-acento)",
              boxShadow: "var(--shadow-gold)",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl" style={{ color: "var(--color-acento)" }} aria-hidden="true">
                ↺
              </span>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-acento)" }}>
                  {totalRevisoes} exercício{totalRevisoes > 1 ? "s" : ""} para revisão
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-conteudo-secundario)" }}>
                  Revise agora para manter o progresso
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Pontos a melhorar */}
        {pontosFracos.length > 0 && (
          <div>
            <h2
              className="mb-2.5 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-conteudo-terciario)" }}
            >
              Pontos a melhorar
            </h2>
            <div className="space-y-2">
              {pontosFracos.map((pf) => (
                <button
                  key={pf.unidadeId}
                  onClick={() =>
                    navigate({ to: "/treinar/$unidadeId", params: { unidadeId: pf.unidadeId } })
                  }
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 hover:-translate-y-px"
                  style={{
                    background: "var(--color-superficie-primaria)",
                    border: "1px solid var(--color-borda)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate text-sm font-medium"
                      style={{ color: "var(--color-conteudo-primario)" }}
                    >
                      {pf.nomeUnidade}
                    </p>
                    <div className="mt-1.5">
                      <Progress value={pf.taxaAcerto} label={`Taxa de acerto: ${pf.taxaAcerto}%`} />
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-sm font-bold tabular-nums"
                    style={{ color: "var(--color-erro)" }}
                  >
                    {pf.taxaAcerto}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navegação rápida */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[
            {
              to: "/circulos" as const,
              icon: "♟",
              titulo: "Banco de Exercícios",
              desc: "Escolha uma unidade para treinar",
            },
            {
              to: "/estatisticas" as const,
              icon: "▲",
              titulo: "Estatísticas",
              desc: "Veja seu progresso detalhado",
            },
            {
              to: "/configuracoes" as const,
              icon: "◈",
              titulo: "Configurações",
              desc: "Tema, tabuleiro e preferências",
            },
            {
              to: "/" as const,
              icon: "⏏",
              titulo: "Trocar Perfil",
              desc: "Selecione outro perfil",
            },
          ].map(({ to, icon, titulo, desc }) => (
            <button
              key={to}
              onClick={() => navigate({ to })}
              className="flex items-center gap-3 rounded-lg p-4 text-left transition-all duration-150 hover:-translate-y-px"
              style={{
                background: "var(--color-superficie-primaria)",
                border: "1px solid var(--color-borda)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <span
                className="text-2xl shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: "var(--color-superficie-secundaria)",
                  color: "var(--color-acento)",
                }}
                aria-hidden="true"
              >
                {icon}
              </span>
              <div>
                <p
                  className="font-semibold text-sm"
                  style={{ color: "var(--color-conteudo-primario)" }}
                >
                  {titulo}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-conteudo-secundario)" }}>
                  {desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
