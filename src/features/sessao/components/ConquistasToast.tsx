import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ConquistaPendente {
  id: string;
  nome: string;
  icone: string;
}

interface ConquistasToastProps {
  conquistas: ConquistaPendente[];
  onDismiss: (id: string) => void;
}

export function ConquistasToast({ conquistas, onDismiss }: ConquistasToastProps) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2"
      role="region"
      aria-label="Conquistas desbloqueadas"
      aria-live="polite"
    >
      <AnimatePresence>
        {conquistas.map((c) => (
          <ConquistaItem key={c.id} conquista={c} onDismiss={() => onDismiss(c.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ConquistaItem({
  conquista,
  onDismiss,
}: {
  conquista: ConquistaPendente;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: "spring", damping: 20 }}
      className="flex items-center gap-3 rounded-xl border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] p-3 shadow-lg"
    >
      <span className="text-3xl" aria-hidden="true">
        {conquista.icone}
      </span>
      <div>
        <p className="text-xs font-semibold text-[var(--color-acento)]">Conquista desbloqueada!</p>
        <p className="text-sm font-bold text-[var(--color-conteudo-primario)]">{conquista.nome}</p>
      </div>
    </motion.div>
  );
}
