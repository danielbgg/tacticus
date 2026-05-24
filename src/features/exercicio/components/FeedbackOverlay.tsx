import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";

const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

interface FeedbackOverlayProps {
  onAnimacaoConcluida?: () => void;
}

export function FeedbackOverlay({ onAnimacaoConcluida }: FeedbackOverlayProps) {
  const fase = useSessaoStore((s) => s.fase);

  useEffect(() => {
    if (fase === "acerto" || fase === "erro") {
      const timeout = setTimeout(() => onAnimacaoConcluida?.(), prefersReducedMotion ? 0 : 1200);
      return () => clearTimeout(timeout);
    }
  }, [fase, onAnimacaoConcluida]);

  return (
    <AnimatePresence>
      {fase === "acerto" && (
        <motion.div
          key="acerto"
          initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.2 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-green-500/20"
          role="status"
          aria-live="polite"
          aria-label="Acerto"
        >
          <span className="text-7xl" aria-hidden="true">
            ✓
          </span>
        </motion.div>
      )}

      {fase === "erro" && (
        <motion.div
          key="erro"
          initial={{ opacity: 0 }}
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : {
                  opacity: [0, 1, 1, 1, 0],
                  x: [0, -8, 8, -8, 0],
                }
          }
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-red-500/20"
          role="status"
          aria-live="polite"
          aria-label="Erro"
        >
          <span className="text-7xl" aria-hidden="true">
            ✗
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
