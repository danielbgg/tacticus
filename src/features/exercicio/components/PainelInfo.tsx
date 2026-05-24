import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/Card/Card";
import { Progress } from "@/shared/components/Progress/Progress";
import { Button } from "@/shared/components/Button/Button";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { useMotor } from "@/features/exercicio/hooks/useMotor";
import { progresso as calcProgresso } from "@/features/exercicio/domain/fila-sessao";
import type { FilaSessao } from "@/features/exercicio/domain/fila-sessao";

interface PainelInfoProps {
  nomArea?: string;
  nomeModulo?: string;
  nomeUnidade?: string;
}

export function PainelInfo({ nomArea, nomeModulo, nomeUnidade }: PainelInfoProps) {
  const { t } = useTranslation("sessao");
  const { exercicioAtual, fila, indiceAtual, acertosNaSessao, errosNaSessao, fase } =
    useSessaoStore();
  const [mostrarAnalise, setMostrarAnalise] = useState(false);

  const podeAnalisar = fase === "acerto";
  const { avaliacao, pronto, analisando, analisar, parar } = useMotor({ ativo: mostrarAnalise });

  const filaEstado: FilaSessao = { exercicios: fila, indice: indiceAtual };
  const { atual, total, percentual } = calcProgresso(filaEstado);

  if (!exercicioAtual) return null;

  function handleAnalisar() {
    if (!mostrarAnalise) {
      setMostrarAnalise(true);
      // analisar será chamado quando o worker estiver pronto (via useEffect no hook)
    } else if (avaliacao === null && pronto) {
      analisar(exercicioAtual!.fenInicial);
    }
  }

  // Disparar análise quando worker ficar pronto e painel for aberto
  if (mostrarAnalise && pronto && avaliacao === null && !analisando) {
    analisar(exercicioAtual.fenInicial);
  }

  function handleFecharAnalise() {
    parar();
    setMostrarAnalise(false);
  }

  return (
    <Card className="flex flex-col gap-4">
      {(nomArea || nomeModulo || nomeUnidade) && (
        <div className="text-xs text-[var(--color-conteudo-terciario)]">
          {[nomArea, nomeModulo, nomeUnidade].filter(Boolean).join(" › ")}
        </div>
      )}

      <div>
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-[var(--color-conteudo-secundario)]">
            {t("exercicio", { atual: atual + 1, total })}
          </span>
          <span className="text-xs text-[var(--color-conteudo-terciario)]">{percentual}%</span>
        </div>
        <Progress value={percentual} label="Progresso da sessão" />
      </div>

      <div className="flex justify-center gap-6">
        <div className="text-center">
          <motion.p
            key={acertosNaSessao}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-green-500"
            aria-live="polite"
            aria-label={`${acertosNaSessao} acertos`}
          >
            {acertosNaSessao}
          </motion.p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Acertos</p>
        </div>
        <div className="text-center">
          <motion.p
            key={errosNaSessao}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-red-400"
            aria-live="polite"
            aria-label={`${errosNaSessao} erros`}
          >
            {errosNaSessao}
          </motion.p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Erros</p>
        </div>
      </div>

      {exercicioAtual.partida && (
        <div className="rounded-md bg-[var(--color-superficie-secundaria)] p-3 text-xs">
          <p className="font-medium text-[var(--color-conteudo-primario)]">
            {exercicioAtual.partida.brancas} vs {exercicioAtual.partida.negras}
          </p>
          {exercicioAtual.partida.evento && (
            <p className="text-[var(--color-conteudo-terciario)]">
              {exercicioAtual.partida.evento}
              {exercicioAtual.partida.ano ? `, ${exercicioAtual.partida.ano}` : ""}
            </p>
          )}
          {exercicioAtual.partida.eco && (
            <p className="text-[var(--color-conteudo-terciario)]">
              ECO: {exercicioAtual.partida.eco}
            </p>
          )}
        </div>
      )}

      {/* Botão de análise — visível apenas após acerto */}
      <AnimatePresence>
        {podeAnalisar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            {!mostrarAnalise ? (
              <Button variant="outline" size="sm" onClick={handleAnalisar} className="w-full">
                ♟ Analisar com motor
              </Button>
            ) : (
              <div className="rounded-lg border border-[var(--color-borda)] bg-[var(--color-superficie-secundaria)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-conteudo-secundario)]">
                    Análise Stockfish
                  </span>
                  <button
                    onClick={handleFecharAnalise}
                    className="text-xs text-[var(--color-conteudo-terciario)] hover:text-[var(--color-conteudo-primario)]"
                    aria-label="Fechar análise"
                  >
                    ✕
                  </button>
                </div>

                {analisando || (!pronto && !avaliacao) ? (
                  <p className="text-xs text-[var(--color-conteudo-terciario)] animate-pulse">
                    Calculando…
                  </p>
                ) : avaliacao ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-conteudo-terciario)]">
                        Melhor lance
                      </span>
                      <span className="font-mono text-sm font-bold text-[var(--color-conteudo-primario)]">
                        {avaliacao.melhorLance}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-conteudo-terciario)]">
                        Avaliação
                      </span>
                      <span className="font-mono text-sm text-[var(--color-acento)]">
                        {avaliacao.mate !== null
                          ? `#${avaliacao.mate}`
                          : avaliacao.centipawns !== null
                            ? `${avaliacao.centipawns > 0 ? "+" : ""}${(avaliacao.centipawns / 100).toFixed(2)}`
                            : "—"}
                      </span>
                    </div>
                    {avaliacao.linha.length > 0 && (
                      <p className="mt-1 font-mono text-xs text-[var(--color-conteudo-terciario)] break-all">
                        {avaliacao.linha.slice(0, 5).join(" ")}
                      </p>
                    )}
                    <p className="text-right text-xs text-[var(--color-conteudo-terciario)]">
                      prof. {avaliacao.profundidade}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
