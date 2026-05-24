import { motion } from "framer-motion";
import { Button } from "@/shared/components/Button/Button";
import { Progress } from "@/shared/components/Progress/Progress";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";

interface SessaoResumoProps {
  xpGanho: number;
  tempoTotalMs: number;
  onContinuar: () => void;
  onEncerrar: () => void;
}

export function SessaoResumo({
  xpGanho,
  tempoTotalMs,
  onContinuar,
  onEncerrar,
}: SessaoResumoProps) {
  const { acertosNaSessao, errosNaSessao } = useSessaoStore();
  const total = acertosNaSessao + errosNaSessao;
  const taxa = total > 0 ? Math.round((acertosNaSessao / total) * 100) : 0;
  const minutos = Math.floor(tempoTotalMs / 60000);
  const segundos = Math.floor((tempoTotalMs % 60000) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-12 text-center"
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="text-7xl"
        aria-hidden="true"
      >
        {taxa >= 80 ? "🏆" : taxa >= 50 ? "🎯" : "💪"}
      </motion.span>

      <div>
        <h2 className="text-2xl font-bold text-[var(--color-conteudo-primario)]">
          Sessão concluída!
        </h2>
        <p className="text-[var(--color-conteudo-secundario)]">
          {minutos}m {segundos}s de treino
        </p>
      </div>

      <div className="grid w-full max-w-xs grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-500">{acertosNaSessao}</p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Acertos</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-red-400">{errosNaSessao}</p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Erros</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-[var(--color-acento)]">{taxa}%</p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Precisão</p>
        </div>
      </div>

      {xpGanho > 0 && (
        <div className="w-full max-w-xs">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-[var(--color-conteudo-secundario)]">XP ganho</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-bold text-[var(--color-acento)]"
            >
              +{xpGanho} XP
            </motion.span>
          </div>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            style={{ originX: 0 }}
          >
            <Progress value={Math.min(xpGanho, 100)} label="XP ganho na sessão" />
          </motion.div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="primary" onClick={onContinuar}>
          Continuar treinando
        </Button>
        <Button variant="secondary" onClick={onEncerrar}>
          Encerrar
        </Button>
      </div>
    </motion.div>
  );
}
