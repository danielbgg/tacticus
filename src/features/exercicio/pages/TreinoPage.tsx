import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { TabuleiroInterativo } from "@/features/exercicio/components/TabuleiroInterativo";
import { PainelExercicio } from "@/features/exercicio/components/PainelExercicio";
import { PainelNotacao } from "@/features/exercicio/components/PainelNotacao";
import { PainelMotor } from "@/features/exercicio/components/PainelMotor";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { useSessaoTreino } from "@/features/exercicio/hooks/useSessaoTreino";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { EmptyState } from "@/shared/components/EmptyState/EmptyState";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import { Button } from "@/shared/components/Button/Button";
import { Confetti } from "@/shared/components/Confetti/Confetti";
import { getDb } from "@/db/schema";
import { buscarUnidadeComModulo, buscarProximaUnidade } from "@/db/queries/estrutura";
import type { UnidadeId } from "@/shared/types/branded";

type FasePagina = "carregando" | "dialogo-retomar" | "treinando" | "concluida" | "vazia";

function formatarDataPausa(data: Date): string {
  const diffMs = Date.now() - data.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  return `há ${Math.floor(diffH / 24)} dia(s)`;
}

export function TreinoPage() {
  const { t } = useTranslation("sessao");
  const navigate = useNavigate();
  const { unidadeId } = useParams({ from: "/treinar/$unidadeId" });
  const configuracoes = usePerfilStore((s) => s.configuracoes);
  const { iniciar, confirmar, pausar, processarLance } = useSessaoTreino();

  const { data: unidadeInfo } = useQuery({
    queryKey: ["unidade-modulo", unidadeId],
    queryFn: async () => {
      const db = await getDb();
      const r = await buscarUnidadeComModulo(db as never, unidadeId);
      return r.ok ? r.value : null;
    },
  });

  const { data: proximaUnidade } = useQuery({
    queryKey: ["proxima-unidade", unidadeId],
    queryFn: async () => {
      const db = await getDb();
      const r = await buscarProximaUnidade(db as never, unidadeId);
      return r.ok ? r.value : null;
    },
  });
  const store = useSessaoStore();
  const [mostrarSolucao, setMostrarSolucao] = useState(false);
  const [chaveReset, setChaveReset] = useState(0);
  const [fasePagina, setFasePagina] = useState<FasePagina>("carregando");
  const [lancesNotacao, setLancesNotacao] = useState<string[]>([]);
  const [fenAtual, setFenAtual] = useState(store.exercicioAtual?.fenInicial ?? "");
  // Impede dupla criação de sessão causada pelo React StrictMode (executa efeitos 2× em dev)
  const confirmadoRef = useRef(false);

  useEffect(() => {
    confirmadoRef.current = false;
    iniciar.mutate(unidadeId as UnidadeId);
    return () => {
      pausar(unidadeId as UnidadeId);
      store.encerrarSessao();
    };
  }, [unidadeId]);

  // Reage ao resultado da mutation
  useEffect(() => {
    if (!iniciar.isSuccess) return;
    if (confirmadoRef.current) return;
    confirmadoRef.current = true;
    const { sessaoPausada, filaFresca } = iniciar.data;
    if (sessaoPausada) {
      setFasePagina("dialogo-retomar");
    } else if (filaFresca.length === 0) {
      setFasePagina("vazia");
    } else {
      confirmar(unidadeId as UnidadeId, "fresco");
      setFasePagina("treinando");
    }
  }, [iniciar.isSuccess]);

  // Detecta fim de sessão e persiste no banco imediatamente (não aguarda cleanup)
  useEffect(() => {
    if (fasePagina === "treinando" && store.exercicioAtual === null && store.fila.length > 0) {
      setFasePagina("concluida");
      // Encerra a sessão no banco proativamente — o cleanup é assíncrono e pode perder o estado
      void (async () => {
        const { sessaoId, acertosNaSessao, errosNaSessao } = useSessaoStore.getState();
        const perfilAtivoId = usePerfilStore.getState().perfilAtivoId;
        const totalTentativas = acertosNaSessao + errosNaSessao;
        if (sessaoId && totalTentativas > 0 && perfilAtivoId) {
          const { encerrarSessao: encerrar } = await import("@/db/queries/sessoes");
          const db = await import("@/db/schema").then((m) => m.getDb());
          await encerrar(db as never, sessaoId, { totalTentativas, totalAcertos: acertosNaSessao });
        }
      })();
    }
  }, [fasePagina, store.exercicioAtual, store.fila.length]);

  async function handleRetomar() {
    await confirmar(unidadeId as UnidadeId, "retomar");
    setFasePagina("treinando");
  }

  async function handleComecarDoZero() {
    await confirmar(unidadeId as UnidadeId, "fresco");
    setFasePagina("treinando");
  }

  function handleLanceCorreto(tempoMs: number) {
    processarLance(true, tempoMs);
  }

  function handleLanceErrado(tempoMs: number) {
    setMostrarSolucao(false);
    processarLance(false, tempoMs);
  }

  function handleUsarDica() {
    store.usarDica();
  }

  function handleDesistir() {
    setMostrarSolucao(true);
  }

  function handleTentarNovamente() {
    setMostrarSolucao(false);
    setChaveReset((k) => k + 1);
    store.resetarParaTentando();
  }

  function handleProximo() {
    setMostrarSolucao(false);
    store.avancarExercicio();
  }

  if (fasePagina === "carregando") {
    return (
      <div className="flex flex-col gap-6 p-6" aria-busy="true" aria-label="Carregando sessão">
        <Skeleton className="h-[480px] w-full max-w-[560px] mx-auto rounded-xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (fasePagina === "dialogo-retomar") {
    const pausada = iniciar.data?.sessaoPausada;
    const restantes = pausada?.fila.length ?? 0;
    const quando = pausada ? formatarDataPausa(pausada.pausadaEm) : "";
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--color-borda)] bg-[var(--color-superficie)] p-8 shadow-lg text-center flex flex-col gap-6">
          <span className="text-5xl" aria-hidden="true">
            ⏸
          </span>
          <div>
            <h2 className="text-xl font-bold text-[var(--color-conteudo-primario)]">
              Sessão pausada encontrada
            </h2>
            <p className="mt-2 text-sm text-[var(--color-conteudo-secundario)]">
              {restantes} exercício{restantes !== 1 ? "s" : ""} restante{restantes !== 1 ? "s" : ""}{" "}
              · pausada {quando}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={handleRetomar} className="w-full">
              Retomar de onde parei
            </Button>
            <Button variant="ghost" onClick={handleComecarDoZero} className="w-full">
              Começar do zero
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (fasePagina === "vazia") {
    return (
      <EmptyState
        icone="🏆"
        titulo={t("semExercicios")}
        descricao={t("semExerciciosDescricao")}
        acaoLabel={t("voltarBanco")}
        onAcao={() => navigate({ to: "/circulos" })}
      />
    );
  }

  if (fasePagina === "concluida") {
    const total = store.acertosNaSessao + store.errosNaSessao;
    const precisao = total > 0 ? Math.round((store.acertosNaSessao / total) * 100) : 0;
    const tempoMedioS =
      store.acertosNaSessao > 0 ? Math.round(store.tempoTotalMs / store.acertosNaSessao / 1000) : 0;
    const temMedioStr =
      tempoMedioS >= 60
        ? `${Math.floor(tempoMedioS / 60)}m ${tempoMedioS % 60}s`
        : `${tempoMedioS}s`;
    const temErros = store.errosSessionIds.length > 0;
    const boaSessao = precisao >= 70;

    return (
      <div className="relative flex flex-col items-center justify-center min-h-full py-12 px-6">
        {boaSessao && <Confetti />}

        {/* Card central de conclusão */}
        <div
          className="relative w-full max-w-md rounded-xl p-8 text-center z-10"
          style={{
            background: "var(--color-superficie-primaria)",
            border: "1px solid var(--color-borda)",
            boxShadow: boaSessao ? "var(--shadow-gold)" : "var(--shadow-lg)",
          }}
        >
          {/* Ícone de troféu */}
          <div
            className="mx-auto mb-5 w-20 h-20 rounded-full flex items-center justify-center text-4xl"
            style={{
              background: boaSessao
                ? "linear-gradient(135deg, var(--color-acento) 0%, var(--color-acento-hover) 100%)"
                : "var(--color-superficie-secundaria)",
              boxShadow: boaSessao ? "var(--shadow-gold)" : "none",
            }}
          >
            {boaSessao ? "🏆" : "🎯"}
          </div>

          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--color-conteudo-primario)" }}
          >
            {t("sessaoConcluida")}
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-conteudo-secundario)" }}>
            {unidadeInfo?.unidadeNome ?? "Sessão encerrada"}
          </p>

          {/* Grade de estatísticas */}
          <div
            className="grid grid-cols-4 gap-2 mb-6 rounded-lg p-4"
            style={{ background: "var(--color-superficie-secundaria)" }}
          >
            {[
              {
                valor: `${precisao}%`,
                label: "Precisão",
                cor:
                  precisao >= 80
                    ? "var(--color-sucesso)"
                    : precisao >= 60
                      ? "var(--color-aviso)"
                      : "var(--color-erro)",
              },
              { valor: store.acertosNaSessao, label: "Acertos", cor: "var(--color-sucesso)" },
              { valor: store.errosNaSessao, label: "Erros", cor: "var(--color-erro)" },
              {
                valor: store.acertosNaSessao > 0 ? temMedioStr : "—",
                label: "Tempo médio",
                cor: "var(--color-conteudo-primario)",
              },
            ].map(({ valor, label, cor }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-xl font-bold tabular-nums" style={{ color: cor }}>
                  {valor}
                </span>
                <span
                  className="text-[10px] mt-0.5"
                  style={{ color: "var(--color-conteudo-terciario)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-2.5">
            {proximaUnidade && (
              <button
                onClick={() =>
                  navigate({ to: "/treinar/$unidadeId", params: { unidadeId: proximaUnidade.id } })
                }
                className="w-full rounded-lg py-3 font-semibold text-sm transition-all hover:-translate-y-px"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-acento) 0%, var(--color-acento-hover) 100%)",
                  color: "#fff",
                  boxShadow: "var(--shadow-gold)",
                }}
              >
                Próxima unidade · {proximaUnidade.nome}
              </button>
            )}
            {temErros && (
              <button
                onClick={() => navigate({ to: "/refazer" })}
                className="w-full rounded-lg py-3 font-semibold text-sm transition-all hover:-translate-y-px"
                style={{
                  border: "1px solid var(--color-erro)",
                  color: "var(--color-erro)",
                  background: "rgba(224,82,82,0.06)",
                }}
              >
                Revisar {store.errosSessionIds.length} erro
                {store.errosSessionIds.length !== 1 ? "s" : ""}
              </button>
            )}
            <button
              onClick={() => navigate({ to: "/circulos" })}
              className="w-full rounded-lg py-3 font-semibold text-sm transition-colors"
              style={{
                color: "var(--color-conteudo-secundario)",
              }}
            >
              {t("voltarBanco")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // fasePagina === "treinando"
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="w-full xl:flex-1 min-w-0 xl:max-w-[calc(100vh-8rem)]">
          <TabuleiroInterativo
            onLanceCorreto={handleLanceCorreto}
            onLanceErrado={handleLanceErrado}
            onLancesChange={setLancesNotacao}
            onFenChange={setFenAtual}
            pedirSolucao={mostrarSolucao}
            chaveReset={chaveReset}
            {...(configuracoes?.estiloTabuleiro != null
              ? { estiloTabuleiro: configuracoes.estiloTabuleiro }
              : {})}
            {...(configuracoes?.modoDaltonico != null
              ? { modoDaltonico: configuracoes.modoDaltonico }
              : {})}
          />
        </div>
        <div className="w-full xl:w-72 xl:shrink-0 flex flex-col gap-3">
          <PainelExercicio
            onUsarDica={handleUsarDica}
            onDesistir={handleDesistir}
            onProximo={handleProximo}
            onTentarNovamente={handleTentarNovamente}
            unidadeNome={unidadeInfo?.unidadeNome}
            moduloNome={unidadeInfo?.moduloNome}
          />
          <PainelNotacao lances={lancesNotacao} />
          {fenAtual && <PainelMotor fen={fenAtual} exercicioId={store.exercicioAtual?.id} />}
        </div>
      </div>
    </div>
  );
}
