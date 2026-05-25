import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/Card/Card";
import { Button } from "@/shared/components/Button/Button";
import { Progress } from "@/shared/components/Progress/Progress";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { getDb } from "@/db/schema";
import { buscarProgressoExercicio } from "@/db/queries/progresso";

interface PainelExercicioProps {
  onUsarDica: () => void;
  onDesistir: () => void;
  onProximo: () => void;
  onTentarNovamente: () => void;
  unidadeNome?: string | undefined;
  moduloNome?: string | undefined;
}

const MENSAGENS_ACERTO = ["Excelente!", "Perfeito!", "Muito bem!", "Correto!"];
const MENSAGENS_ERRO = ["Ops, tente novamente", "Quase lá!", "Não foi dessa vez"];

const TEMAS_PT: Record<string, string> = {
  mateIn1: "Mate em 1",
  mateIn2: "Mate em 2",
  mateIn3: "Mate em 3",
  mateIn4: "Mate em 4",
  mateIn5: "Mate em 5",
  anastasiaMate: "Mate Anastásia",
  arabianMate: "Mate Árabe",
  backRankMate: "Mate no Fundo",
  bodenMate: "Mate Boden",
  doubleBishopMate: "Mate dos Bispos",
  dovetailMate: "Mate Andorinha",
  hookMate: "Mate do Gancho",
  smotheredMate: "Mate Afogado",
  queenRookMate: "Mate Dama+Torre",
  hangingPiece: "Peça Pendurada",
  fork: "Garfo",
  pin: "Cravada",
  skewer: "Espeto",
  attackingF2F7: "Ataque F2/F7",
  discoveredAttack: "Ataque Descoberto",
  doubleCheck: "Cheque Duplo",
  deflection: "Desvio",
  attraction: "Atração",
  interference: "Interferência",
  trappedPiece: "Peça Encurralada",
  zugzwang: "Zugzwang",
  sacrifice: "Sacrifício",
  xRayAttack: "Raio-X",
  clearance: "Desobstrução",
  quietMove: "Lance Quieto",
  endgame: "Final",
  middlegame: "Meio-jogo",
  opening: "Abertura",
  equality: "Igualdade",
  advantage: "Vantagem",
  crushing: "Esmagador",
  master: "Mestre",
  masterVsMaster: "Mestre vs Mestre",
};

function traduzirTema(tema: string): string {
  return TEMAS_PT[tema] ?? tema;
}

function mensagemAleatoria(lista: string[]): string {
  return lista[Math.floor(Math.random() * lista.length)] ?? lista[0] ?? "";
}

function formatarTempo(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function formatarTempoMedio(totalMs: number, acertos: number): string {
  if (acertos === 0) return "—";
  const media = Math.round(totalMs / acertos / 1000);
  if (media < 60) return `${media}s`;
  return `${Math.floor(media / 60)}m ${media % 60}s`;
}

export function PainelExercicio({
  onUsarDica,
  onDesistir,
  onProximo,
  onTentarNovamente,
  unidadeNome,
  moduloNome,
}: PainelExercicioProps) {
  const { t } = useTranslation("sessao");
  const {
    exercicioAtual,
    fase,
    fila,
    indiceAtual,
    acertosNaSessao,
    errosNaSessao,
    dicasUsadas,
    iniciadaEm,
    pausado,
    pausar,
    retomar,
    exerciciosConcluidos,
    totalExerciciosUnidade,
    tempoTotalMs,
  } = useSessaoStore();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);

  const [tempoSessao, setTempoSessao] = useState("00:00");
  const [tempoExercicio, setTempoExercicio] = useState("00:00");
  const exercicioIniciadoEm = useRef<Date>(new Date());

  useEffect(() => {
    exercicioIniciadoEm.current = new Date();
    setTempoExercicio("00:00");
  }, [exercicioAtual?.id]);

  useEffect(() => {
    if (fase === "acerto" || fase === "aguardando" || pausado) return;
    const id = setInterval(() => {
      if (iniciadaEm) {
        setTempoSessao(formatarTempo(Date.now() - iniciadaEm.getTime()));
      }
      setTempoExercicio(formatarTempo(Date.now() - exercicioIniciadoEm.current.getTime()));
    }, 1000);
    return () => clearInterval(id);
  }, [iniciadaEm, fase, pausado]);

  const { data: progressoExercicio } = useQuery({
    queryKey: ["progresso-exercicio", perfilAtivoId, exercicioAtual?.id],
    enabled: !!perfilAtivoId && !!exercicioAtual,
    queryFn: async () => {
      if (!perfilAtivoId || !exercicioAtual) return null;
      const db = await getDb();
      const r = await buscarProgressoExercicio(db as never, perfilAtivoId, exercicioAtual.id);
      return r.ok ? r.value : null;
    },
  });

  if (!exercicioAtual) return null;

  const total = fila.length + indiceAtual;
  const progresso = total > 0 ? (indiceAtual / total) * 100 : 0;
  const vezesResolvido = progressoExercicio?.totalAcertos ?? 0;
  const rating = exercicioAtual.rating;
  const totalUnidade = totalExerciciosUnidade;
  const concluidosUnicos = exerciciosConcluidos.length;

  return (
    <div className="flex flex-col gap-3">
      {/* ── ZONA DE CONTEXTO ── compacta, estática */}
      <div className="rounded-xl border border-[var(--color-borda)] bg-[var(--color-superficie)] px-4 py-3 space-y-3">
        {/* Breadcrumb: módulo › unidade */}
        {(moduloNome || unidadeNome) && (
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--color-conteudo-terciario)] mb-0.5">
              Método PCT — Círculos
            </p>
            <div className="flex items-center gap-1.5 text-sm">
              {moduloNome && (
                <span className="font-semibold text-[var(--color-conteudo-primario)]">
                  {moduloNome}
                </span>
              )}
              {moduloNome && unidadeNome && (
                <span className="text-[var(--color-conteudo-terciario)]">›</span>
              )}
              {unidadeNome && (
                <span className="text-[var(--color-conteudo-secundario)]">{unidadeNome}</span>
              )}
            </div>
          </div>
        )}

        {/* Grade de progresso da unidade */}
        {totalUnidade > 0 && (
          <div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: Math.min(totalUnidade, 30) }).map((_, i) => {
                const exercicioId = fila[i]?.id ?? exerciciosConcluidos[i];
                const concluido = exercicioId
                  ? exerciciosConcluidos.includes(exercicioId)
                  : i < concluidosUnicos;
                const atual = i === indiceAtual && fase !== "acerto";
                return (
                  <div
                    key={i}
                    className={`h-3.5 w-3.5 rounded-sm transition-colors ${
                      concluido
                        ? "bg-[var(--color-sucesso)]"
                        : atual
                          ? "bg-[var(--color-acento)] animate-pulse"
                          : "bg-[var(--color-superficie-secundaria)] border border-[var(--color-borda)]"
                    }`}
                  />
                );
              })}
            </div>
            <p className="mt-1 text-xs text-[var(--color-conteudo-terciario)]">
              {concluidosUnicos}/{totalUnidade} concluídos
            </p>
          </div>
        )}

        {/* Barra de progresso + ✓/✗ numa linha */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-conteudo-terciario)]">
              {t("exercicio", { atual: indiceAtual + 1, total })}
            </span>
            <span className="flex gap-3">
              <span className="font-medium text-[var(--color-sucesso)]">✓ {acertosNaSessao}</span>
              <span className="font-medium text-[var(--color-erro)]">✗ {errosNaSessao}</span>
            </span>
          </div>
          <Progress value={progresso} label="Progresso da sessão" />
        </div>

        {/* Timers + pausa em 1 linha compacta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--color-conteudo-secundario)] font-mono tabular-nums">
            <span title="Tempo de sessão">{tempoSessao}</span>
            <span className="text-[var(--color-borda)] select-none">|</span>
            <span title="Tempo no exercício">{tempoExercicio}</span>
            <span className="text-[var(--color-borda)] select-none">|</span>
            <span className="text-[var(--color-conteudo-terciario)]" title="Tempo médio por acerto">
              {formatarTempoMedio(tempoTotalMs, acertosNaSessao)}
            </span>
          </div>
          <button
            onClick={pausado ? retomar : pausar}
            className={`flex items-center justify-center h-7 w-7 rounded-md border text-xs transition-colors ${
              pausado
                ? "border-[var(--color-acento)] bg-[var(--color-acento)]/10 text-[var(--color-acento)] hover:bg-[var(--color-acento)]/20"
                : "border-[var(--color-borda)] bg-[var(--color-superficie-secundaria)] text-[var(--color-conteudo-secundario)] hover:border-[var(--color-acento)] hover:text-[var(--color-acento)]"
            }`}
            title={pausado ? "Retomar" : "Pausar"}
            aria-label={pausado ? "Retomar sessão" : "Pausar sessão"}
          >
            {pausado ? "▶" : "⏸"}
          </button>
        </div>
      </div>

      {/* ── ZONA DE AÇÃO ── proeminente, muda conforme a fase */}
      <AnimatePresence mode="wait">
        {fase === "acerto" && (
          <motion.div
            key="acerto"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-[var(--color-sucesso)]/30 bg-[var(--color-sucesso)]/5">
              <p className="text-xl font-semibold text-[var(--color-sucesso)]">
                {mensagemAleatoria(MENSAGENS_ACERTO)}
              </p>

              {exercicioAtual.temas && exercicioAtual.temas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {exercicioAtual.temas.map((tema) => (
                    <span
                      key={tema}
                      className="rounded-full bg-[var(--color-sucesso)]/10 border border-[var(--color-sucesso)]/20 px-2 py-0.5 text-xs text-[var(--color-sucesso)]"
                    >
                      {traduzirTema(tema)}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-conteudo-terciario)]">
                <span className="font-mono">#{exercicioAtual.id}</span>
                {vezesResolvido > 0 && <span>Resolvido {vezesResolvido}×</span>}
              </div>

              <Button onClick={onProximo} variant="primary" className="mt-4 w-full">
                {t("proximo")}
              </Button>
            </Card>
          </motion.div>
        )}

        {fase === "erro" && (
          <motion.div
            key="erro"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-[var(--color-erro)]/30 bg-[var(--color-erro)]/5">
              <p className="text-xl font-semibold text-[var(--color-erro)]">
                {mensagemAleatoria(MENSAGENS_ERRO)}
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={onTentarNovamente} variant="secondary" className="flex-1">
                  {t("tentar")}
                </Button>
                <Button onClick={onProximo} variant="ghost" className="flex-1">
                  {t("proximo")}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {(fase === "tentando" || fase === "dica") && (
          <motion.div key="tentando" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <p className="text-sm font-semibold text-[var(--color-conteudo-primario)]">
                {t("encontreMelhorLance")}
              </p>

              {exercicioAtual.partida && (
                <div className="mt-2 rounded-md bg-[var(--color-superficie-secundaria)] p-3 text-xs text-[var(--color-conteudo-secundario)]">
                  <p className="font-medium">
                    {exercicioAtual.partida.brancas} vs {exercicioAtual.partida.negras}
                  </p>
                  {exercicioAtual.partida.evento && (
                    <p className="mt-0.5">
                      {exercicioAtual.partida.evento}
                      {exercicioAtual.partida.ano ? `, ${exercicioAtual.partida.ano}` : ""}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-2 flex items-center justify-between text-xs text-[var(--color-conteudo-terciario)]">
                <span className="font-mono">#{exercicioAtual.id}</span>
                <span className="flex items-center gap-2">
                  {rating != null && (
                    <span className="rounded-full bg-[var(--color-superficie-secundaria)] px-2 py-0.5 font-semibold text-[var(--color-conteudo-secundario)]">
                      ★ {rating}
                    </span>
                  )}
                  {vezesResolvido > 0 && <span>Resolvido {vezesResolvido}×</span>}
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onUsarDica}
                  disabled={dicasUsadas >= 3}
                  className="flex-1"
                >
                  {t("dica")} {dicasUsadas > 0 ? `(${dicasUsadas}/3)` : ""}
                </Button>
                <Button variant="ghost" size="sm" onClick={onDesistir} className="flex-1">
                  {t("desistir")}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
