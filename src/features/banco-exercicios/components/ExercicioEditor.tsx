import { useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { Button } from "@/shared/components/Button/Button";
import { ErrorMessage } from "@/shared/components/ErrorMessage/ErrorMessage";
import type { Exercicio, TipoExercicio } from "@/shared/types/domain";

interface ExercicioEditorProps {
  exercicio?: Partial<Exercicio>;
  onSalvar: (dados: {
    fen: string;
    lancesSolucao: string[];
    tipo: TipoExercicio;
    descricao?: string;
  }) => void;
  onCancelar: () => void;
  isSaving?: boolean;
}

export function ExercicioEditor({
  exercicio,
  onSalvar,
  onCancelar,
  isSaving,
}: ExercicioEditorProps) {
  const [fen, setFen] = useState(
    exercicio?.fen ?? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  );
  const [lancesSolucao, setLancesSolucao] = useState<string[]>(exercicio?.lancesSolucao ?? []);
  const [tipo, setTipo] = useState<TipoExercicio>(exercicio?.tipo ?? "tatica");
  const [descricao, setDescricao] = useState(exercicio?.descricao ?? "");
  const [fenErro, setFenErro] = useState<string | null>(null);
  const [lancesInput, setLancesInput] = useState(exercicio?.lancesSolucao?.join(" ") ?? "");

  function validarEAtualizarFen(valor: string) {
    setFen(valor);
    try {
      new Chess(valor);
      setFenErro(null);
    } catch {
      setFenErro("FEN inválido");
    }
  }

  function parsearLances(input: string) {
    const lances = input.trim().split(/\s+/).filter(Boolean);
    setLancesSolucao(lances);
    setLancesInput(input);
  }

  function fenPreviewValido() {
    try {
      new Chess(fen);
      return true;
    } catch {
      return false;
    }
  }

  function handleSalvar() {
    if (fenErro || !fenPreviewValido()) return;
    onSalvar({ fen, lancesSolucao, tipo, ...(descricao ? { descricao } : {}) });
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Preview do tabuleiro */}
      <div className="shrink-0">
        <div className="w-64 overflow-hidden rounded-xl border border-[var(--color-borda)]">
          {fenPreviewValido() ? (
            <Chessboard position={fen} boardWidth={256} arePiecesDraggable={false} />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center bg-[var(--color-superficie-secundaria)] text-sm text-[var(--color-conteudo-terciario)]">
              FEN inválido
            </div>
          )}
        </div>
      </div>

      {/* Formulário */}
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-conteudo-secundario)]">
            FEN *
          </label>
          <input
            type="text"
            value={fen}
            onChange={(e) => validarEAtualizarFen(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] px-3 py-2 font-mono text-sm text-[var(--color-conteudo-primario)] focus:outline-none focus:ring-2 focus:ring-[var(--color-acento)]"
            spellCheck={false}
          />
          {fenErro && <ErrorMessage mensagem={fenErro} />}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-conteudo-secundario)]">
            Lances da solução (UCI, separados por espaço)
          </label>
          <input
            type="text"
            value={lancesInput}
            onChange={(e) => parsearLances(e.target.value)}
            placeholder="e2e4 e7e5 g1f3..."
            className="w-full rounded-lg border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] px-3 py-2 font-mono text-sm text-[var(--color-conteudo-primario)] placeholder:text-[var(--color-conteudo-terciario)] focus:outline-none focus:ring-2 focus:ring-[var(--color-acento)]"
            spellCheck={false}
          />
          {lancesSolucao.length > 0 && (
            <p className="mt-1 text-xs text-[var(--color-conteudo-terciario)]">
              {lancesSolucao.length} lance(s) registrado(s)
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-conteudo-secundario)]">
            Tipo
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoExercicio)}
            className="rounded-lg border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] px-3 py-2 text-sm text-[var(--color-conteudo-primario)] focus:outline-none focus:ring-2 focus:ring-[var(--color-acento)]"
          >
            <option value="tatica">Tática</option>
            <option value="estrategia">Estratégia</option>
            <option value="tecnica">Técnica</option>
            <option value="abertura">Abertura</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-conteudo-secundario)]">
            Descrição (opcional)
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] px-3 py-2 text-sm text-[var(--color-conteudo-primario)] placeholder:text-[var(--color-conteudo-terciario)] focus:outline-none focus:ring-2 focus:ring-[var(--color-acento)]"
            placeholder="Descreva o tema ou contexto..."
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleSalvar}
            disabled={!!fenErro || !fenPreviewValido() || lancesSolucao.length === 0 || !!isSaving}
            isLoading={!!isSaving}
          >
            {exercicio?.id ? "Atualizar exercício" : "Criar exercício"}
          </Button>
          <Button variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
