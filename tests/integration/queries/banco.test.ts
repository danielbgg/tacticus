import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "node-sqlite3-wasm";
import { adaptDb, criarDbMemoria as criarDbBase } from "../helpers/db-adapter";
import {
  criarExercicioCustomizado,
  atualizarExercicio,
  excluirExercicio,
} from "@/db/queries/exercicios-crud";
import { buscarExercicio } from "@/db/queries/exercicios";
import { toExercicioId, toUnidadeId } from "@/shared/types/branded";

function criarDbMemoria() {
  return criarDbBase((db) => {
    db.exec(`INSERT INTO areas (id, nome, ordem) VALUES ('a1', 'Táticas', 1)`);
    db.exec(`INSERT INTO modulos (id, area_id, nome, ordem) VALUES ('m1', 'a1', 'Mod', 1)`);
    db.exec(`INSERT INTO unidades (id, modulo_id, nome, ordem) VALUES ('u1', 'm1', 'Unid', 1)`);
    db.exec(
      `INSERT INTO partidas (id, brancas, negras, resultado, ano) VALUES ('p1', 'A', 'B', '1-0', 2000)`,
    );
    db.exec(`INSERT INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, ordem)
             VALUES ('e-padrao', 'u1', 'p1', 'startpos', '["e2e4"]', 1)`);
  });
}

describe("queries/exercicios-crud — banco customizado", () => {
  let raw: InstanceType<typeof Database>;
  let db: ReturnType<typeof adaptDb>;

  beforeEach(() => {
    raw = criarDbMemoria();
    db = adaptDb(raw);
  });
  afterEach(() => raw.close());

  it("criarExercicioCustomizado cria exercício", async () => {
    const r = await criarExercicioCustomizado(db, {
      unidadeId: toUnidadeId("u1"),
      fenInicial: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
      lancesSolucao: ["e7e5"],
      ordem: 2,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const ex = raw.prepare("SELECT * FROM exercicios WHERE id = ?").get(r.value.id);
      expect(ex).toBeTruthy();
    }
  });

  it("atualizarExercicio modifica lances da solução", async () => {
    const criado = await criarExercicioCustomizado(db, {
      unidadeId: toUnidadeId("u1"),
      fenInicial: "startpos",
      lancesSolucao: ["e2e4"],
      ordem: 3,
    });
    if (!criado.ok) throw new Error("falhou criar");
    const r = await atualizarExercicio(db, criado.value.id, { lancesSolucao: ["d2d4", "d7d5"] });
    expect(r.ok).toBe(true);
  });

  it("excluirExercicio remove exercício customizado", async () => {
    const criado = await criarExercicioCustomizado(db, {
      unidadeId: toUnidadeId("u1"),
      fenInicial: "startpos",
      lancesSolucao: ["e2e4"],
      ordem: 4,
    });
    if (!criado.ok) throw new Error("falhou criar");
    await excluirExercicio(db, criado.value.id);
    const r = await buscarExercicio(db, criado.value.id);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeNull();
  });

  it("excluirExercicio rejeita exercícios padrão", async () => {
    const r = await excluirExercicio(db, toExercicioId("e-padrao"));
    expect(r.ok).toBe(false);
  });
});
