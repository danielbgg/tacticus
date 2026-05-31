import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TabuleiroInterativo } from "@/features/exercicio/components/TabuleiroInterativo";
import { PainelExercicio } from "@/features/exercicio/components/PainelExercicio";
import { PainelNotacao } from "@/features/exercicio/components/PainelNotacao";
import { PainelMotor } from "@/features/exercicio/components/PainelMotor";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { useSessaoTreino } from "@/features/exercicio/hooks/useSessaoTreino";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { EmptyState } from "@/shared/components/EmptyState/EmptyState";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import { getDb } from "@/db/schema";
import { buscarExerciciosPorIds } from "@/db/queries/exercicios";
import { criarSessao, encerrarSessao } from "@/db/queries/sessoes";
import type { SessaoId } from "@/shared/types/branded";

type Fase = "carregando" | "treinando" | "concluida" | "vazia";

export function RefazerErrosPage() {
  const { t } = useTranslation("sessao");
  const navigate = useNavigate();
  const store = useSessaoStore();
  const { processarLance } = useSessaoTreino();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);
  const configuracoes = usePerfilStore((s) => s.configuracoes);

  const [fase, setFase] = useState<Fase>("carregando");
  const [lancesNotacao, setLancesNotacao] = useState<string[]>([]);
  const [fenAtual, setFenAtual] = useState("");
  const [mostrarSolucao, setMostrarSolucao] = useState(false);
  const [chaveReset, setChaveReset] = useState(0);
  const iniciadoRef = useRef(false);

  // Captura errosSessionIds antes de qualquer reset
  const errosIds = useRef(useSessaoStore.getState().errosSessionIds);

  useEffect(() => {
    if (iniciadoRef.current) return;
    iniciadoRef.current = true;

    const ids = errosIds.current;
    if (!perfilAtivoId || ids.length === 0) {
      setFase("vazia");
      return;
    }

    async function init() {
      const db = await getDb();
      const rEx = await buscarExerciciosPorIds(db as never, ids);
      if (!rEx.ok || rEx.value.length === 0) {
        setFase("vazia");
        return;
      }

      const rSessao = await criarSessao(db as never, {
        perfilId: perfilAtivoId!,
        modo: "revisao",
      });
      const sessaoId = rSessao.ok ? rSessao.value.id : (crypto.randomUUID() as SessaoId);

      store.iniciarSessao(sessaoId, "revisao", rEx.value, rEx.value.length);
      setFase("treinando");
    }

    void init();

    return () => {
      const { sessaoId, acertosNaSessao, errosNaSessao } = useSessaoStore.getState();
      const totalTentativas = acertosNaSessao + errosNaSessao;
      if (sessaoId && totalTentativas > 0 && perfilAtivoId) {
        void (async () => {
          const db = await getDb();
          await encerrarSessao(db as never, sessaoId, {
            totalTentativas,
            totalAcertos: acertosNaSessao,
          });
        })();
      }
      store.encerrarSessao();
    };
  }, []);

  // Detecta fim de sessão
  useEffect(() => {
    if (fase === "treinando" && store.exercicioAtual === null && store.fila.length > 0) {
      setFase("concluida");
    }
  }, [fase, store.exercicioAtual, store.fila.length]);

  function handleLanceCorreto(tempoMs: number) {
    processarLance(true, tempoMs);
  }

  function handleLanceErrado(tempoMs: number) {
    setMostrarSolucao(false);
    processarLance(false, tempoMs);
  }

  if (fase === "carregando") {
    return (
      <div className="flex flex-col gap-6 p-6" aria-busy="true">
        <Skeleton className="h-[480px] w-full max-w-[560px] mx-auto rounded-xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (fase === "vazia") {
    return (
      <EmptyState
        icone="✓"
        titulo="Nenhum erro para revisar"
        descricao="Você não teve erros nesta sessão, ou não há sessão recente."
        acaoLabel="Voltar para os Círculos"
        onAcao={() => navigate({ to: "/circulos" })}
      />
    );
  }

  if (fase === "concluida") {
    const total = store.acertosNaSessao + store.errosNaSessao;
    const precisao = total > 0 ? Math.round((store.acertosNaSessao / total) * 100) : 0;

    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
        <span className="text-6xl" aria-hidden="true">
          ✓
        </span>
        <h2 className="text-2xl font-bold text-[var(--color-conteudo-primario)]">
          Revisão de erros concluída
        </h2>
        <div className="flex gap-6">
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-[var(--color-sucesso)]">{precisao}%</span>
            <span className="text-xs text-[var(--color-conteudo-terciario)]">Precisão</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-[var(--color-sucesso)]">
              {store.acertosNaSessao}
            </span>
            <span className="text-xs text-[var(--color-conteudo-terciario)]">Acertos</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-[var(--color-erro)]">
              {store.errosNaSessao}
            </span>
            <span className="text-xs text-[var(--color-conteudo-terciario)]">Erros</span>
          </div>
        </div>
        <button
          onClick={() => navigate({ to: "/circulos" })}
          className="rounded-lg bg-[var(--color-acento)] px-6 py-3 font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Voltar para os Círculos
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="mb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-conteudo-terciario)]">
          Revisão de Erros
        </p>
        <p className="text-sm text-[var(--color-conteudo-secundario)]">
          {errosIds.current.length} exercício{errosIds.current.length !== 1 ? "s" : ""} com erro
          nesta sessão
        </p>
      </div>
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
            onUsarDica={() => store.usarDica()}
            onDesistir={() => setMostrarSolucao(true)}
            onProximo={() => {
              setMostrarSolucao(false);
              store.avancarExercicio();
            }}
            onTentarNovamente={() => {
              setMostrarSolucao(false);
              setChaveReset((k) => k + 1);
              store.resetarParaTentando();
            }}
          />
          <PainelNotacao lances={lancesNotacao} />
          {fenAtual && <PainelMotor fen={fenAtual} exercicioId={store.exercicioAtual?.id} />}
        </div>
      </div>
    </div>
  );
}
