import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/Card/Card";
import { Button } from "@/shared/components/Button/Button";
import { Progress } from "@/shared/components/Progress/Progress";
import { useSessaoStore } from "@/features/exercicio/store/useSessaoStore";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { getDb } from "@/db/schema";
import { buscarProgressoExercicio } from "@/db/queries/progresso";

interface PainelExercicioProps {
  onUsarDica: () => void;
  onDesistir: () => void;
  onProximo: () => void;
  onTentarNovamente: () => void;
}

const MENSAGENS_ACERTO = ["Excelente!", "Perfeito!", "Muito bem!", "Correto!"];
const MENSAGENS_ERRO = ["Ops, tente novamente", "Quase lá!", "Não foi dessa vez"];

const TEMAS_PT: Record<string, string> = {
  mateIn1: "Mate em 1",
  mateIn2: "Mate em 2",
  mateIn3: "Mate em 3",
  mateIn4: "Mate em 4",
  mateIn5: "Mate em 5",
  anastasiaMate: "Mate Anastásia",
  arabianMate: "Mate Árabe",
  backRankMate: "Mate no Fundo",
  bodenMate: "Mate Boden",
  doubleBishopMate: "Mate dos Bispos",
  dovetailMate: "Mate Andorinha",
  hookMate: "Mate do Gancho",
  smotheredMate: "Mate Afogado",
  queenRookMate: "Mate Dama+Torre",
  hangingPiece: "Peça Pendurada",
  fork: "Garfo",
  pin: "Cravada",
  skewer: "Espeto",
  attackingF2F7: "Ataque F2/F7",
  discoveredAttack: "Ataque Descoberto",
  doubleCheck: "Cheque Duplo",
  deflection: "Desvio",
  attraction: "Atração",
  interference: "Interferência",
  trappedPiece: "Peça Encurralada",
  zugzwang: "Zugzwang",
  sacrifice: "Sacrifício",
  xRayAttack: "Raio-X",
  clearance: "Desobstrução",
  quietMove: "Lance Quieto",
  endgame: "Final",
  middlegame: "Meio-jogo",
  opening: "Abertura",
  equality: "Igualdade",
  advantage: "Vantagem",
  crushing: "Esmagador",
  master: "Mestre",
  masterVsMaster: "Mestre vs Mestre",
};

function traduzirTema(tema: string): string {
  return TEMAS_PT[tema] ?? tema;
}

function mensagemAleatoria(lista: string[]): string {
  return lista[Math.floor(Math.random() * lista.length)] ?? lista[0] ?? "";
}

function ladoDeFen(fen: string): "brancas" | "negras" {
  return (fen.split(" ")[1] ?? "w") === "w" ? "brancas" : "negras";
}

function formatarTempo(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function PainelExercicio({
  onUsarDica,
  onDesistir,
  onProximo,
  onTentarNovamente,
}: PainelExercicioProps) {
  const { t } = useTranslation("sessao");
  const {
    exercicioAtual,
    fase,
    fila,
    indiceAtual,
    acertosNaSessao,
    errosNaSessao,
    dicasUsadas,
    iniciadaEm,
  } = useSessaoStore();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);

  const [tempoSessao, setTempoSessao] = useState("00:00");
  const [tempoExercicio, setTempoExercicio] = useState("00:00");
  const exercicioIniciadoEm = useRef<Date>(new Date());

  // Reseta o relógio do exercício quando muda de exercício
  useEffect(() => {
    exercicioIniciadoEm.current = new Date();
    setTempoExercicio("00:00");
  }, [exercicioAtual?.id]);

  // Tick a cada segundo — pausa quando o exercício está concluído (acerto)
  useEffect(() => {
    if (fase === "acerto" || fase === "aguardando") return;
    const id = setInterval(() => {
      if (iniciadaEm) {
        setTempoSessao(formatarTempo(Date.now() - iniciadaEm.getTime()));
      }
      setTempoExercicio(formatarTempo(Date.now() - exercicioIniciadoEm.current.getTime()));
    }, 1000);
    return () => clearInterval(id);
  }, [iniciadaEm, fase]);

  const { data: progressoExercicio } = useQuery({
    queryKey: ["progresso-exercicio", perfilAtivoId, exercicioAtual?.id],
    enabled: !!perfilAtivoId && !!exercicioAtual,
    queryFn: async () => {
      if (!perfilAtivoId || !exercicioAtual) return null;
      const db = await getDb();
      const r = await buscarProgressoExercicio(db as never, perfilAtivoId, exercicioAtual.id);
      return r.ok ? r.value : null;
    },
  });

  if (!exercicioAtual) return null;

  const total = fila.length + indiceAtual;
  const progresso = total > 0 ? (indiceAtual / total) * 100 : 0;
  const lado = ladoDeFen(exercicioAtual.fenInicial);
  const vezesResolvido = progressoExercicio?.totalAcertos ?? 0;
  const rating = exercicioAtual.rating;

  return (
    <div className="flex flex-col gap-4">
      {/* Relógios */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--color-borda)] bg-[var(--color-superficie)] px-4 py-2 text-xs font-mono">
        <div className="flex flex-col items-center">
          <span className="text-[var(--color-conteudo-terciario)] uppercase tracking-wider text-[10px]">
            Sessão
          </span>
          <span className="text-lg font-bold text-[var(--color-conteudo-primario)] tabular-nums">
            {tempoSessao}
          </span>
        </div>
        <div className="w-px h-8 bg-[var(--color-borda)]" />
        <div className="flex flex-col items-center">
          <span className="text-[var(--color-conteudo-terciario)] uppercase tracking-wider text-[10px]">
            Exercício
          </span>
          <span className="text-lg font-bold text-[var(--color-conteudo-primario)] tabular-nums">
            {tempoExercicio}
          </span>
        </div>
      </div>

      {/* Progresso da sessão */}
      <div className="flex items-center justify-between text-sm text-[var(--color-conteudo-secundario)]">
        <span>{t("exercicio", { atual: indiceAtual + 1, total })}</span>
        <span className="flex gap-3">
          <span className="text-green-500">✓ {acertosNaSessao}</span>
          <span className="text-red-500">✗ {errosNaSessao}</span>
        </span>
      </div>

      <Progress value={progresso} label="Progresso da sessão" />

      {/* Info do exercício: lado e dificuldade */}
      <div className="flex items-center justify-between text-xs px-1">
        <span className="font-semibold text-[var(--color-conteudo-secundario)]">
          {lado === "brancas" ? "♙ Você joga com as Brancas" : "♟ Você joga com as Negras"}
        </span>
        {rating != null && (
          <span className="rounded-full bg-[var(--color-superficie-secundaria)] px-2 py-0.5 text-[var(--color-conteudo-terciario)]">
            ★ {rating}
          </span>
        )}
      </div>

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
              {exercicioAtual.temas && exercicioAtual.temas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1 justify-center">
                  {exercicioAtual.temas.map((tema) => (
                    <span
                      key={tema}
                      className="rounded-full bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-xs text-green-700 dark:text-green-400"
                    >
                      {traduzirTema(tema)}
                    </span>
                  ))}
                </div>
              )}
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
              <div className="mt-3 flex gap-2 justify-center">
                <Button onClick={onTentarNovamente} variant="secondary">
                  {t("tentar")}
                </Button>
                <Button onClick={onProximo} variant="ghost">
                  {t("proximo")}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {(fase === "tentando" || fase === "dica") && (
          <motion.div key="tentando" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <p className="mb-3 text-sm font-medium text-[var(--color-conteudo-primario)]">
                {t("encontreMelhorLance")}
              </p>
              {exercicioAtual.partida && (
                <div className="mb-3 rounded-md bg-[var(--color-superficie-secundaria)] p-3 text-xs text-[var(--color-conteudo-secundario)]">
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
              <div className="mb-3 flex items-center justify-between text-xs text-[var(--color-conteudo-terciario)]">
                <span className="font-mono">#{exercicioAtual.id}</span>
                {vezesResolvido > 0 && <span>Resolvido {vezesResolvido}×</span>}
              </div>
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
