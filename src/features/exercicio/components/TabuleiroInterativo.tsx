import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { Square, Piece } from "react-chessboard/dist/chessboard/types";
import { Chess } from "chess.js";
import { Tabuleiro } from "@/shared/components/Tabuleiro/Tabuleiro";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { somLance, somCaptura, somAcerto, somErro } from "@/shared/lib/somTabuleiro";
import type { EstiloTabuleiro } from "@/shared/types/domain";

interface TabuleiroInterativoProps {
  onLanceCorreto: (tempoMs: number) => void;
  onLanceErrado: (tempoMs: number) => void;
  onLancesChange?: (lances: string[]) => void;
  onFenChange?: (fen: string) => void;
  pedirSolucao?: boolean;
  chaveReset?: number;
  estiloTabuleiro?: EstiloTabuleiro;
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

const PECAS_PROMOCAO: [string, string, string][] = [
  ["q", "♕", "♛"],
  ["r", "♖", "♜"],
  ["b", "♗", "♝"],
  ["n", "♘", "♞"],
];

const normSAN = (s: string) => s.replace(/[+#]$/, "");

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
  onLancesChange,
  onFenChange,
  pedirSolucao = false,
  chaveReset = 0,
  estiloTabuleiro = "classico",
  modoDaltonico = false,
}: TabuleiroInterativoProps) {
  const { exercicioAtual, fase, pausado } = useSessaoStore();
  const [fenAtual, setFenAtualRaw] = useState(exercicioAtual?.fenInicial ?? "");

  const setFenAtual = useCallback(
    (fen: string) => {
      setFenAtualRaw(fen);
      onFenChange?.(fen);
    },
    [onFenChange],
  );
  const [indiceEsperado, setIndiceEsperado] = useState(0);
  const [ultimoLance, setUltimoLance] = useState<{ origem: Square; destino: Square } | null>(null);
  const [casaSelecionada, setCasaSelecionada] = useState<Square | null>(null);
  const [destinosLegais, setDestinosLegais] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [lancesJogados, setLancesJogados] = useState<string[]>([]);
  const inicioRef = useRef<number>(Date.now());
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const registrarLance = useCallback(
    (san: string) => {
      setLancesJogados((prev) => {
        const novo = [...prev, san];
        onLancesChange?.(novo);
        return novo;
      });
    },
    [onLancesChange],
  );

  const orientacao = useMemo<"white" | "black">(() => {
    if (!exercicioAtual) return "white";
    const chess = new Chess(exercicioAtual.fenInicial);
    return chess.turn() === "w" ? "white" : "black";
  }, [exercicioAtual?.id]);

  // Turno atual do FEN em exibição (para indicador dinâmico)
  const turnoAtualFen = useMemo<"w" | "b">(() => {
    if (!fenAtual) return "w";
    try {
      return new Chess(fenAtual).turn();
    } catch {
      return "w";
    }
  }, [fenAtual]);

  useEffect(() => {
    if (exercicioAtual) {
      setFenAtualRaw(exercicioAtual.fenInicial);
      onFenChange?.(exercicioAtual.fenInicial);
      setIndiceEsperado(0);
      setUltimoLance(null);
      setCasaSelecionada(null);
      setDestinosLegais([]);
      setPendingPromotion(null);
      setLancesJogados([]);
      onLancesChange?.([]);
      inicioRef.current = Date.now();
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    }
  }, [exercicioAtual?.id, chaveReset]);

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

  const executarLance = useCallback(
    (origem: Square, destino: Square, promotion?: string) => {
      if (!exercicioAtual) return;

      const chess = new Chess(fenAtual);

      if (!promotion && isMovimentoPromocao(chess, origem, destino)) {
        setPendingPromotion({ from: origem, to: destino, color: chess.turn() });
        return;
      }

      const resultado = chess.move({ from: origem, to: destino, promotion: promotion ?? "q" });
      if (!resultado) return;

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
        registrarLance(resultado.san);
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
                registrarLance(match.san);
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
        setLancesJogados([]);
        onLancesChange?.([]);
        onLanceErrado(tempoMs);
      }
    },
    [
      exercicioAtual,
      fenAtual,
      indiceEsperado,
      onLanceCorreto,
      onLanceErrado,
      onLancesChange,
      registrarLance,
    ],
  );

  const finalizarPromocao = useCallback(
    (piece: string) => {
      if (!pendingPromotion) return;
      executarLance(pendingPromotion.from, pendingPromotion.to, piece);
    },
    [pendingPromotion, executarLance],
  );

  const handlePieceDrop = useCallback(
    (from: Square, to: Square, _piece: Piece): boolean => {
      if (pausado) return false;
      if (!exercicioAtual || (fase !== "tentando" && fase !== "dica")) return false;
      if (pendingPromotion) return false;

      const chess = new Chess(fenAtual);

      if (isMovimentoPromocao(chess, from, to)) {
        const peca = chess.get(from);
        if (peca) setPendingPromotion({ from, to, color: peca.color });
        return false;
      }

      // Verifica legalidade via lista de movimentos — mais robusto que chess.move()
      const movimentos = chess.moves({ verbose: true });
      const moveLegal = movimentos.some((m) => m.from === from && m.to === to);
      if (!moveLegal) return false;

      executarLance(from, to);
      return true;
    },
    [pausado, exercicioAtual, fase, pendingPromotion, fenAtual, executarLance],
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (pausado) return;
      if (!exercicioAtual || (fase !== "tentando" && fase !== "dica")) return;
      if (pendingPromotion) return;

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
      pausado,
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

  // fenAtual pode ser "" no primeiro render (antes do useEffect atualizar o estado)
  const fenEfetivo = fenAtual || exercicioAtual.fenInicial;
  const chess = new Chess(fenEfetivo);

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

  // Indicador do turno abaixo do tabuleiro
  const eVezDoJogador = turnoAtualFen === (orientacao === "white" ? "w" : "b");
  const nomeJogador = orientacao === "white" ? "Brancas" : "Negras";
  const nomeOponente = orientacao === "white" ? "Negras" : "Brancas";
  const iconeJogador = orientacao === "white" ? "♙" : "♟";
  const iconeOponente = orientacao === "white" ? "♟" : "♙";

  return (
    <div className="flex flex-col items-center w-full gap-3">
      <div className="relative w-full">
        <Tabuleiro
          fen={fenEfetivo}
          orientacao={orientacao}
          estiloTabuleiro={estiloTabuleiro}
          ultimoLance={ultimoLance}
          casasDestacadas={casasDestacadas}
          setas={setasDica}
          modoDaltonico={modoDaltonico}
          arrastavel={!pendingPromotion && !pausado}
          onSquareClick={handleSquareClick}
          onPieceDrop={handlePieceDrop}
        />

        {/* Overlay de pausa */}
        {pausado && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-lg backdrop-blur-sm bg-black/50">
            <div className="text-5xl mb-3 text-white select-none">⏸</div>
            <p className="text-xl font-bold text-white tracking-wide">Pausado</p>
          </div>
        )}

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

      {/* Indicador do lado — abaixo do tabuleiro */}
      <div className="flex items-center justify-center gap-6 w-full px-2">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            eVezDoJogador
              ? "bg-[var(--color-acento)]/15 border border-[var(--color-acento)]/40 shadow-sm"
              : "opacity-50"
          }`}
        >
          <span className="text-2xl leading-none" aria-hidden="true">
            {iconeJogador}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-[var(--color-conteudo-terciario)] uppercase tracking-wider">
              Você joga com as
            </span>
            <span className="text-base font-bold text-[var(--color-conteudo-primario)]">
              {nomeJogador}
            </span>
          </div>
          {eVezDoJogador && (
            <span className="ml-1 h-2 w-2 rounded-full bg-[var(--color-acento)] animate-pulse" />
          )}
        </div>

        <div className="text-[var(--color-conteudo-terciario)] text-lg select-none">vs</div>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            !eVezDoJogador
              ? "bg-[var(--color-superficie-secundaria)] border border-[var(--color-borda)]"
              : "opacity-40"
          }`}
        >
          <span className="text-2xl leading-none" aria-hidden="true">
            {iconeOponente}
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-[var(--color-conteudo-terciario)] uppercase tracking-wider">
              Oponente
            </span>
            <span className="text-base font-bold text-[var(--color-conteudo-secundario)]">
              {nomeOponente}
            </span>
          </div>
          {!eVezDoJogador && (
            <span className="ml-1 h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
