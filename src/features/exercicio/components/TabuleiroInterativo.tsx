import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { Square, Piece } from "react-chessboard/dist/chessboard/types";
import { Chess } from "chess.js";
import { Tabuleiro } from "@/shared/components/Tabuleiro/Tabuleiro";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { somLance, somCaptura, somAcerto, somErro } from "@/shared/lib/somTabuleiro";
import type { EstiloTabuleiro, ConjuntoPecas } from "@/shared/types/domain";

interface TabuleiroInterativoProps {
  onLanceCorreto: (tempoMs: number) => void;
  onLanceErrado: (tempoMs: number) => void;
  pedirSolucao?: boolean;
  chaveReset?: number;
  estiloTabuleiro?: EstiloTabuleiro;
  conjuntoPecas?: ConjuntoPecas;
  modoDaltonico?: boolean;
}

interface PendingPromotion {
  from: Square;
  to: Square;
  color: "w" | "b";
}

const COR_SELECIONADA = "rgba(20, 85, 30, 0.5)";
const COR_DESTINO = "rgba(20, 85, 30, 0.3)";
const COR_DESTINO_PECA = "rgba(20, 85, 30, 0.5)";

// Peças de promoção: [código, símbolo branco, símbolo preto]
const PECAS_PROMOCAO: [string, string, string][] = [
  ["q", "♕", "♛"],
  ["r", "♖", "♜"],
  ["b", "♗", "♝"],
  ["n", "♘", "♞"],
];

// Compara moves ignorando anotações de xeque/mate — seed pode ter "Ra8#" mas chess.js gera "Ra8+"
const normSAN = (s: string) => s.replace(/[+#]$/, "");

// uci inclui peça de promoção quando aplicável (ex: "e7e8q")
function matchMove(uci: string, san: string, lanceStr: string): boolean {
  return uci === lanceStr || normSAN(san) === normSAN(lanceStr);
}

function isMovimentoPromocao(chess: Chess, from: Square, to: Square): boolean {
  const peca = chess.get(from);
  if (!peca || peca.type !== "p") return false;
  return (peca.color === "w" && to[1] === "8") || (peca.color === "b" && to[1] === "1");
}

export function TabuleiroInterativo({
  onLanceCorreto,
  onLanceErrado,
  pedirSolucao = false,
  chaveReset = 0,
  estiloTabuleiro = "classico",
  modoDaltonico = false,
}: TabuleiroInterativoProps) {
  const { exercicioAtual, fase } = useSessaoStore();
  const [fenAtual, setFenAtual] = useState(exercicioAtual?.fenInicial ?? "");
  const [indiceEsperado, setIndiceEsperado] = useState(0);
  const [ultimoLance, setUltimoLance] = useState<{ origem: Square; destino: Square } | null>(null);
  const [casaSelecionada, setCasaSelecionada] = useState<Square | null>(null);
  const [destinosLegais, setDestinosLegais] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const inicioRef = useRef<number>(Date.now());
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Orientação fixada pelo turno do FEN inicial — não muda durante o exercício
  const orientacao = useMemo<"white" | "black">(() => {
    if (!exercicioAtual) return "white";
    const chess = new Chess(exercicioAtual.fenInicial);
    return chess.turn() === "w" ? "white" : "black";
  }, [exercicioAtual?.id]);

  useEffect(() => {
    if (exercicioAtual) {
      setFenAtual(exercicioAtual.fenInicial);
      setIndiceEsperado(0);
      setUltimoLance(null);
      setCasaSelecionada(null);
      setDestinosLegais([]);
      setPendingPromotion(null);
      inicioRef.current = Date.now();
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    }
  }, [exercicioAtual?.id, chaveReset]);

  // Exibe a solução completa quando pedirSolucao ativa
  useEffect(() => {
    if (!pedirSolucao || !exercicioAtual) return;

    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setPendingPromotion(null);

    const chess = new Chess(fenAtual);
    const lancesPendentes = exercicioAtual.lancesSolucao.slice(indiceEsperado);
    const passos: { fen: string; from: Square; to: Square }[] = [];

    for (const lanceStr of lancesPendentes) {
      const lances = chess.moves({ verbose: true });
      // Incluímos peça de promoção no UCI para matchMove funcionar com lances como "e7e8q"
      const match = lances.find((m) =>
        matchMove(m.from + m.to + (m.promotion ?? ""), m.san, lanceStr),
      );
      if (!match) break;
      chess.move({ from: match.from, to: match.to, promotion: match.promotion ?? "q" });
      passos.push({ fen: chess.fen(), from: match.from as Square, to: match.to as Square });
    }

    let delay = 300;
    setCasaSelecionada(null);
    setDestinosLegais([]);

    for (const passo of passos) {
      const { fen, from, to } = passo;
      const t = setTimeout(() => {
        setFenAtual(fen);
        setUltimoLance({ origem: from, destino: to });
      }, delay);
      timeoutsRef.current.push(t);
      delay += 600;
    }

    const t = setTimeout(() => onLanceErrado(0), delay);
    timeoutsRef.current.push(t);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [pedirSolucao]);

  // Executa o lance após usuário escolher peça de promoção (ou diretamente se não for promoção)
  const executarLance = useCallback(
    (origem: Square, destino: Square, promotion?: string) => {
      if (!exercicioAtual) return;

      const chess = new Chess(fenAtual);

      // Detecta promoção antes de executar: pede peça ao usuário
      if (!promotion && isMovimentoPromocao(chess, origem, destino)) {
        setPendingPromotion({ from: origem, to: destino, color: chess.turn() });
        return;
      }

      const resultado = chess.move({ from: origem, to: destino, promotion: promotion ?? "q" });
      if (!resultado) return;

      // UCI completo inclui peça de promoção quando aplicável
      const lanceUci = origem + destino + (resultado.promotion ?? "");
      const lanceEsperado = exercicioAtual.lancesSolucao[indiceEsperado];
      const tempoMs = Date.now() - inicioRef.current;

      setUltimoLance({ origem, destino });
      setCasaSelecionada(null);
      setDestinosLegais([]);
      setPendingPromotion(null);

      if (matchMove(lanceUci, resultado.san, lanceEsperado ?? "")) {
        resultado.captured ? somCaptura() : somLance();
        setFenAtual(chess.fen());
        const proximo = indiceEsperado + 1;
        if (proximo >= exercicioAtual.lancesSolucao.length) {
          somAcerto();
          onLanceCorreto(tempoMs);
        } else {
          setIndiceEsperado(proximo);
          const lanceResposta = exercicioAtual.lancesSolucao[proximo];
          if (lanceResposta) {
            const t = setTimeout(() => {
              const chess2 = new Chess(chess.fen());
              const lances = chess2.moves({ verbose: true });
              const match = lances.find((m) =>
                matchMove(m.from + m.to + (m.promotion ?? ""), m.san, lanceResposta),
              );
              if (match) {
                chess2.move({ from: match.from, to: match.to, promotion: match.promotion ?? "q" });
                setFenAtual(chess2.fen());
                setUltimoLance({ origem: match.from as Square, destino: match.to as Square });
                setIndiceEsperado(proximo + 1);
              }
            }, 400);
            timeoutsRef.current.push(t);
          }
        }
      } else {
        somErro();
        setFenAtual(exercicioAtual.fenInicial);
        setIndiceEsperado(0);
        setUltimoLance(null);
        onLanceErrado(tempoMs);
      }
    },
    [exercicioAtual, fenAtual, indiceEsperado, onLanceCorreto, onLanceErrado],
  );

  const finalizarPromocao = useCallback(
    (piece: string) => {
      if (!pendingPromotion) return;
      executarLance(pendingPromotion.from, pendingPromotion.to, piece);
    },
    [pendingPromotion, executarLance],
  );

  // Drag-and-drop
  // Retornar true = peça fica visualmente no destino (react-chessboard não faz snap-back)
  // Retornar false = snap-back animado (peça volta à origem)
  // O FEN real é sempre controlado por `fenAtual`; o retorno afeta apenas a animação de drag.
  const handlePieceDrop = useCallback(
    (from: Square, to: Square, _piece: Piece): boolean => {
      if (!exercicioAtual || (fase !== "tentando" && fase !== "dica")) return false;
      if (pendingPromotion) return false;

      const chess = new Chess(fenAtual);

      // Promoção via drag: exibe diálogo e faz snap-back (peça volta à 7ª fileira)
      if (isMovimentoPromocao(chess, from, to)) {
        const peca = chess.get(from);
        if (peca) setPendingPromotion({ from, to, color: peca.color });
        return false;
      }

      // Verifica legalidade sem executar o lance definitivo
      const moveLegal = chess.move({ from, to }) !== null;
      if (!moveLegal) return false; // lance ilegal: snap-back

      // Lance legal: executa a lógica de validação e mantém a peça no destino
      executarLance(from, to);
      return true;
    },
    [exercicioAtual, fase, pendingPromotion, fenAtual, executarLance],
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!exercicioAtual || (fase !== "tentando" && fase !== "dica")) return;
      if (pendingPromotion) return; // aguardando escolha de promoção

      const chess = new Chess(fenAtual);
      const turnoAtual = chess.turn();

      if (casaSelecionada && destinosLegais.includes(square)) {
        executarLance(casaSelecionada, square);
        return;
      }

      const pecaNaCasa = chess.get(square);
      if (pecaNaCasa && pecaNaCasa.color === turnoAtual) {
        const lances = chess.moves({ square, verbose: true });
        setCasaSelecionada(square);
        setDestinosLegais(lances.map((m) => m.to as Square));
      } else {
        setCasaSelecionada(null);
        setDestinosLegais([]);
      }
    },
    [
      exercicioAtual,
      fase,
      fenAtual,
      casaSelecionada,
      destinosLegais,
      executarLance,
      pendingPromotion,
    ],
  );

  if (!exercicioAtual) return null;

  const chess = new Chess(fenAtual);

  // Seta de dica: destaca o lance esperado quando fase === "dica"
  const setasDica = (() => {
    if (fase !== "dica") return [];
    const lanceEsperado = exercicioAtual.lancesSolucao[indiceEsperado];
    if (!lanceEsperado) return [];
    const lances = chess.moves({ verbose: true });
    const match = lances.find((m) =>
      matchMove(m.from + m.to + (m.promotion ?? ""), m.san, lanceEsperado),
    );
    if (!match) return [];
    return [{ origem: match.from as Square, destino: match.to as Square, cor: "rgb(0,120,220)" }];
  })();

  const casasDestacadas: Record<string, React.CSSProperties> = {};
  if (casaSelecionada) {
    casasDestacadas[casaSelecionada] = { backgroundColor: COR_SELECIONADA };
  }
  for (const destino of destinosLegais) {
    const temPeca = !!chess.get(destino);
    casasDestacadas[destino] = {
      backgroundColor: temPeca ? COR_DESTINO_PECA : COR_DESTINO,
      borderRadius: temPeca ? "0%" : "50%",
    };
  }

  return (
    <div className="relative w-full">
      <Tabuleiro
        fen={fenAtual}
        orientacao={orientacao}
        estiloTabuleiro={estiloTabuleiro}
        ultimoLance={ultimoLance}
        casasDestacadas={casasDestacadas}
        setas={setasDica}
        modoDaltonico={modoDaltonico}
        arrastavel={!pendingPromotion}
        onSquareClick={handleSquareClick}
        onPieceDrop={handlePieceDrop}
      />

      {/* Diálogo de promoção */}
      {pendingPromotion && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/40">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-borda)] bg-[var(--color-superficie)] p-5 shadow-2xl">
            <p className="text-sm font-semibold text-[var(--color-conteudo-primario)]">
              Escolha a peça de promoção
            </p>
            <div className="flex gap-2">
              {PECAS_PROMOCAO.map(([piece, branco, preto]) => (
                <button
                  key={piece}
                  onClick={() => finalizarPromocao(piece)}
                  className="flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--color-borda)] bg-[var(--color-superficie-secundaria)] text-5xl transition-colors hover:border-blue-500 hover:bg-blue-500/10"
                  title={piece.toUpperCase()}
                >
                  {pendingPromotion.color === "w" ? branco : preto}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
