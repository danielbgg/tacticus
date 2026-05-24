import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/Card/Card";
import { Button } from "@/shared/components/Button/Button";
import { Progress } from "@/shared/components/Progress/Progress";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";

interface PainelExercicioProps {
  onUsarDica: () => void;
  onDesistir: () => void;
  onProximo: () => void;
}

const MENSAGENS_ACERTO = ["Excelente!", "Perfeito!", "Muito bem!", "Correto!"];
const MENSAGENS_ERRO = ["Ops, tente novamente", "Quase lá!", "Não foi dessa vez"];

function mensagemAleatoria(lista: string[]): string {
  return lista[Math.floor(Math.random() * lista.length)] ?? lista[0] ?? "";
}

export function PainelExercicio({ onUsarDica, onDesistir, onProximo }: PainelExercicioProps) {
  const { t } = useTranslation("sessao");
  const { exercicioAtual, fase, fila, indiceAtual, acertosNaSessao, errosNaSessao, dicasUsadas } =
    useSessaoStore();

  if (!exercicioAtual) return null;

  const total = fila.length + indiceAtual;
  const progresso = total > 0 ? (indiceAtual / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm text-[var(--color-conteudo-secundario)]">
        <span>{t("exercicio", { atual: indiceAtual + 1, total })}</span>
        <span className="flex gap-3">
          <span className="text-green-500">✓ {acertosNaSessao}</span>
          <span className="text-red-500">✗ {errosNaSessao}</span>
        </span>
      </div>

      <Progress value={progresso} label="Progresso da sessão" />

      <AnimatePresence mode="wait">
        {fase === "acerto" && (
          <motion.div
            key="acerto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-green-500/30 bg-green-500/5 text-center">
              <p className="text-xl font-semibold text-green-600">
                {mensagemAleatoria(MENSAGENS_ACERTO)}
              </p>
              <Button onClick={onProximo} variant="primary" className="mt-3">
                {t("proximo")}
              </Button>
            </Card>
          </motion.div>
        )}

        {fase === "erro" && (
          <motion.div
            key="erro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-red-500/30 bg-red-500/5 text-center">
              <p className="text-xl font-semibold text-red-600">
                {mensagemAleatoria(MENSAGENS_ERRO)}
              </p>
              <Button onClick={onProximo} variant="secondary" className="mt-3">
                {t("tentar")}
              </Button>
            </Card>
          </motion.div>
        )}

        {fase === "tentando" && (
          <motion.div key="tentando" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <p className="mb-3 text-sm font-medium text-[var(--color-conteudo-primario)]">
                {t("encontreMelhorLance")}
              </p>
              {exercicioAtual.partida && (
                <div className="mb-4 rounded-md bg-[var(--color-superficie-secundaria)] p-3 text-xs text-[var(--color-conteudo-secundario)]">
                  <p className="font-medium">
                    {exercicioAtual.partida.brancas} vs {exercicioAtual.partida.negras}
                  </p>
                  {exercicioAtual.partida.evento && (
                    <p>
                      {exercicioAtual.partida.evento}
                      {exercicioAtual.partida.ano ? `, ${exercicioAtual.partida.ano}` : ""}
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onUsarDica}
                  disabled={dicasUsadas >= 3}
                >
                  {t("dica")} {dicasUsadas > 0 ? `(${dicasUsadas}/3)` : ""}
                </Button>
                <Button variant="ghost" size="sm" onClick={onDesistir}>
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
