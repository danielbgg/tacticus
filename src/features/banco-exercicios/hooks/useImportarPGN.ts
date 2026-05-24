import { useState, useCallback } from "react";
import { parsearPgn, extrairPosicoes } from "@/shared/lib/pgn-parser";
import { getDb } from "@/db/schema";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { useQueryClient } from "@tanstack/react-query";

type Status = "idle" | "processando" | "concluido" | "erro";

const CHUNK_SIZE = 10;

async function inserirExercicioTauri(dados: {
  fen: string;
  lancesSolucao: string[];
  tipo: string;
  partida: {
    brancas?: string;
    negras?: string;
    evento?: string;
    ano?: number;
    eco?: string;
    eloBrancas?: number;
    eloNegras?: number;
    resultado?: string;
    pgn?: string;
  };
}): Promise<void> {
  const db = await getDb();
  const partidaId = crypto.randomUUID();
  await db.execute(
    `INSERT INTO partidas (id, brancas, negras, evento, ano, eco, elo_brancas, elo_negras, resultado, pgn)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      partidaId,
      dados.partida.brancas ?? null,
      dados.partida.negras ?? null,
      dados.partida.evento ?? null,
      dados.partida.ano ?? null,
      dados.partida.eco ?? null,
      dados.partida.eloBrancas ?? null,
      dados.partida.eloNegras ?? null,
      dados.partida.resultado ?? null,
      dados.partida.pgn ?? null,
    ],
  );

  const exercicioId = crypto.randomUUID();
  await db.execute(
    `INSERT INTO exercicios (id, partida_id, fen_inicial, lances_solucao, ordem)
     VALUES (?, ?, ?, ?, 0)`,
    [exercicioId, partidaId, dados.fen, JSON.stringify(dados.lancesSolucao)],
  );
}

export function useImportarPGN() {
  const [progresso, setProgresso] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [erro, setErro] = useState<string | null>(null);
  const perfilId = usePerfilStore((s) => s.perfilAtivoId);
  const qc = useQueryClient();

  const importar = useCallback(
    async (pgn: string) => {
      if (!perfilId) {
        setErro("Nenhum perfil ativo");
        setStatus("erro");
        return;
      }

      setStatus("processando");
      setProgresso(0);
      setErro(null);

      try {
        const jogos = pgn
          .split(/\n\n\[/)
          .map((s, i) => (i === 0 ? s : "[" + s))
          .filter((s) => s.trim().length > 0);

        const total = jogos.length;
        let processados = 0;

        for (let i = 0; i < total; i += CHUNK_SIZE) {
          const chunk = jogos.slice(i, i + CHUNK_SIZE);

          await Promise.all(
            chunk.map(async (jogoRaw) => {
              try {
                const resultado = parsearPgn(jogoRaw);
                if (!resultado.ok) return;
                const parsed = resultado.value;

                const posicoes = extrairPosicoes(parsed);
                for (const pos of posicoes) {
                  await inserirExercicioTauri({
                    fen: pos.fenAntes,
                    lancesSolucao: [pos.lance],
                    tipo: "tatica",
                    partida: {
                      ...(parsed.headers["White"] ? { brancas: parsed.headers["White"] } : {}),
                      ...(parsed.headers["Black"] ? { negras: parsed.headers["Black"] } : {}),
                      ...(parsed.headers["Event"] ? { evento: parsed.headers["Event"] } : {}),
                      ...(parsed.headers["Date"]
                        ? { ano: parseInt(parsed.headers["Date"].split(".")[0] ?? "0", 10) }
                        : {}),
                      ...(parsed.headers["ECO"] ? { eco: parsed.headers["ECO"] } : {}),
                      ...(parsed.headers["WhiteElo"]
                        ? { eloBrancas: parseInt(parsed.headers["WhiteElo"], 10) }
                        : {}),
                      ...(parsed.headers["BlackElo"]
                        ? { eloNegras: parseInt(parsed.headers["BlackElo"], 10) }
                        : {}),
                      ...(parsed.headers["Result"] ? { resultado: parsed.headers["Result"] } : {}),
                      pgn: jogoRaw,
                    },
                  });
                }
              } catch {
                // Ignorar jogos inválidos no lote
              }
            }),
          );

          processados += chunk.length;
          setProgresso(Math.round((processados / total) * 100));

          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        await qc.invalidateQueries({ queryKey: ["exercicios"] });
        setStatus("concluido");
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao importar PGN");
        setStatus("erro");
      }
    },
    [perfilId, qc],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setProgresso(0);
    setErro(null);
  }, []);

  return { importar, progresso, status, erro, reset };
}
