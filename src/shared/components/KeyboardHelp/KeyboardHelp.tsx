import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useKeyboard } from "@/shared/hooks/useKeyboard";

interface Atalho {
  tecla: string;
  descricao: string;
  contexto?: string;
}

const ATALHOS: Atalho[] = [
  { tecla: "H", descricao: "Usar dica", contexto: "Exercício" },
  { tecla: "F", descricao: "Virar tabuleiro", contexto: "Exercício" },
  { tecla: "Enter", descricao: "Próximo exercício", contexto: "Exercício" },
  { tecla: "Escape", descricao: "Pausar sessão", contexto: "Exercício" },
  { tecla: "←", descricao: "Lance anterior", contexto: "Visualizador" },
  { tecla: "→", descricao: "Próximo lance", contexto: "Visualizador" },
  { tecla: "?", descricao: "Mostrar atalhos", contexto: "Global" },
];

export function KeyboardHelp() {
  const [aberto, setAberto] = useState(false);

  useKeyboard({ "?": () => setAberto((v) => !v) });

  return (
    <>
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setAberto(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Atalhos de teclado"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-conteudo-primario)]">
                  Atalhos de Teclado
                </h2>
                <button
                  onClick={() => setAberto(false)}
                  className="rounded-lg p-1 hover:bg-[var(--color-superficie-secundaria)] text-[var(--color-conteudo-terciario)]"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[var(--color-conteudo-terciario)] border-b border-[var(--color-borda)]">
                    <th className="pb-2 text-left font-medium">Tecla</th>
                    <th className="pb-2 text-left font-medium">Ação</th>
                    <th className="pb-2 text-left font-medium">Contexto</th>
                  </tr>
                </thead>
                <tbody>
                  {ATALHOS.map((a, i) => (
                    <tr key={i} className="border-b border-[var(--color-borda)]/50">
                      <td className="py-2">
                        <kbd className="rounded bg-[var(--color-superficie-secundaria)] border border-[var(--color-borda)] px-2 py-0.5 font-mono text-xs text-[var(--color-conteudo-primario)]">
                          {a.tecla}
                        </kbd>
                      </td>
                      <td className="py-2 text-[var(--color-conteudo-secundario)]">
                        {a.descricao}
                      </td>
                      <td className="py-2 text-xs text-[var(--color-conteudo-terciario)]">
                        {a.contexto ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setAberto(true)}
        className="fixed bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-borda)] bg-[var(--color-superficie-secundaria)] text-sm text-[var(--color-conteudo-terciario)] hover:text-[var(--color-conteudo-primario)] transition-colors shadow"
        aria-label="Mostrar atalhos de teclado"
        title="Atalhos de teclado (?)"
      >
        ?
      </button>
    </>
  );
}
