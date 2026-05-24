import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared/components/Button/Button";
import { Progress } from "@/shared/components/Progress/Progress";
import { useImportarPGN } from "../hooks/useImportarPGN";

export function ImportadorPGN() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { importar, progresso, status, erro, reset } = useImportarPGN();

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const pgn = e.target?.result as string;
      if (pgn) importar(pgn);
    };
    reader.readAsText(file, "utf-8");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".pgn")) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {status === "idle" || status === "erro" ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={[
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
                dragging
                  ? "border-[var(--color-acento)] bg-[var(--color-acento)]/5"
                  : "border-[var(--color-borda)] hover:border-[var(--color-acento)]/50",
              ].join(" ")}
            >
              <span className="text-4xl">♟</span>
              <div>
                <p className="font-medium text-[var(--color-conteudo-primario)]">
                  Arraste um arquivo .pgn aqui
                </p>
                <p className="text-sm text-[var(--color-conteudo-terciario)]">
                  ou clique para selecionar
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".pgn"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
            {status === "erro" && erro && <p className="mt-2 text-sm text-red-500">{erro}</p>}
          </motion.div>
        ) : status === "processando" ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] p-6"
          >
            <p className="mb-3 text-sm font-medium text-[var(--color-conteudo-primario)]">
              Importando exercícios...
            </p>
            <Progress value={progresso} className="mb-2" />
            <p className="text-xs text-[var(--color-conteudo-terciario)]">{progresso}% concluído</p>
          </motion.div>
        ) : (
          <motion.div
            key="sucesso"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-8 text-center"
          >
            <span className="text-4xl">✓</span>
            <p className="font-medium text-green-600 dark:text-green-400">Importação concluída!</p>
            <Button variant="outline" size="sm" onClick={reset}>
              Importar outro arquivo
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
