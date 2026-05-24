import { motion } from "framer-motion";
import { Card } from "@/shared/components/Card/Card";
import { Button } from "@/shared/components/Button/Button";
import type { Perfil } from "@/shared/types/domain";

interface PerfilCardProps {
  perfil: Perfil;
  onSelecionar: (perfil: Perfil) => void;
  onExcluir?: (perfil: Perfil) => void;
}

export function PerfilCard({ perfil, onSelecionar, onExcluir }: PerfilCardProps) {
  const ultimoAcesso = perfil.ultimoAcesso.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        interactive
        onClick={() => onSelecionar(perfil)}
        className="flex items-center gap-4"
        role="button"
        tabIndex={0}
        aria-label={`Selecionar perfil ${perfil.nome}`}
        onKeyDown={(e) => e.key === "Enter" && onSelecionar(perfil)}
      >
        <span className="text-4xl" aria-hidden="true">
          {perfil.avatar}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--color-conteudo-primario)] truncate">
            {perfil.nome}
          </p>
          <p className="text-sm text-[var(--color-conteudo-secundario)] capitalize">
            {perfil.nivel}
          </p>
          <p className="text-xs text-[var(--color-conteudo-terciario)]">Acesso em {ultimoAcesso}</p>
        </div>
        {onExcluir && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Excluir perfil ${perfil.nome}`}
            onClick={(e) => {
              e.stopPropagation();
              onExcluir(perfil);
            }}
          >
            ✕
          </Button>
        )}
      </Card>
    </motion.div>
  );
}
