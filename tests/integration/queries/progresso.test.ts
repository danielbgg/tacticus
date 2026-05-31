import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "node-sqlite3-wasm";
import { readFileSync } from "fs";
import { join } from "path";
import { adaptDb } from "../helpers/db-adapter";
import {
  salvarProgresso,
  buscarProgressoExercicio,
  listarExerciciosParaRevisao,
  listarProgressoPerfil,
} from "@/db/queries/progresso";
import { inicializarProgresso, calcularProximaRevisao } from "@/shared/lib/sm2";
import { toPerfilId, toExercicioId } from "@/shared/types/branded";

function criarDbMemoria() {
  const db = new Database(":memory:");
  for (const m of ["0001_init.sql", "0002_add_conquistas.sql", "0012_elo_favoritos_meta.sql"]) {
    db.exec(readFileSync(join(__dirname, "../../../src/db/migrations", m), "utf-8"));
  }
  db.exec(`INSERT INTO perfis (id, nome, nivel, avatar, acertos_para_dominar, criado_em, ultimo_acesso)
           VALUES ('p1', 'Teste', 'iniciante', '♙', 5, datetime('now'), datetime('now'))`);
  db.exec(`INSERT INTO areas (id, nome, ordem) VALUES ('a1', 'Táticas', 1)`);
  db.exec(`INSERT INTO modulos (id, area_id, nome, ordem) VALUES ('m1', 'a1', 'Mod', 1)`);
  db.exec(`INSERT INTO unidades (id, modulo_id, nome, ordem) VALUES ('u1', 'm1', 'Unid', 1)`);
  db.exec(
    `INSERT INTO partidas (id, brancas, negras, resultado, ano) VALUES ('part1', 'A', 'B', '1-0', 2000)`,
  );
  db.exec(`INSERT INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, ordem)
           VALUES ('e1', 'u1', 'part1', 'startpos', '["e2e4"]', 1),
                  ('e2', 'u1', 'part1', 'startpos', '["d2d4"]', 2)`);
  return db;
}

describe("queries/progresso — integração", () => {
  let raw: InstanceType<typeof Database>;
  let db: ReturnType<typeof adaptDb>;
  const perfilId = toPerfilId("p1");
  const exercicioId = toExercicioId("e1");

  beforeEach(() => {
    raw = criarDbMemoria();
    db = adaptDb(raw);
  });
  afterEach(() => raw.close());

  it("salvarProgresso e buscarProgressoExercicio ida-e-volta", async () => {
    const p = inicializarProgresso(perfilId, exercicioId);
    await salvarProgresso(db, p);
    const r = await buscarProgressoExercicio(db, perfilId, exercicioId);
    expect(r.ok).toBe(true);
    if (r.ok && r.value) {
      expect(r.value.status).toBe("nao_visto");
      expect(r.value.acertosConsecutivos).toBe(0);
    }
  });

  it("atualiza progresso após acerto — incrementa acertos consecutivos", async () => {
    let p = inicializarProgresso(perfilId, exercicioId);
    await salvarProgresso(db, p);
    p = calcularProximaRevisao(p, true, 0, 3000, 5);
    await salvarProgresso(db, p);
    const r = await buscarProgressoExercicio(db, perfilId, exercicioId);
    expect(r.ok).toBe(true);
    if (r.ok && r.value) {
      expect(r.value.acertosConsecutivos).toBe(1);
      expect(r.value.status).toBe("em_progresso");
    }
  });

  it("domínio após N acertos consecutivos com revisão agendada", async () => {
    let p = inicializarProgresso(perfilId, exercicioId);
    for (let i = 0; i < 5; i++) p = calcularProximaRevisao(p, true, 0, 2000, 5);
    await salvarProgresso(db, p);
    const r = await buscarProgressoExercicio(db, perfilId, exercicioId);
    expect(r.ok).toBe(true);
    if (r.ok && r.value) {
      expect(r.value.status).toBe("dominado");
      expect(r.value.proximaRevisao).not.toBeNull();
    }
  });

  it("listarExerciciosParaRevisao retorna apenas revisões pendentes", async () => {
    let p = inicializarProgresso(perfilId, exercicioId);
    for (let i = 0; i < 5; i++) p = calcularProximaRevisao(p, true, 0, 2000, 5);
    p = { ...p, proximaRevisao: new Date(Date.now() - 86400000) };
    await salvarProgresso(db, p);
    const r = await listarExerciciosParaRevisao(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBeGreaterThanOrEqual(1);
  });

  it("listarProgressoPerfil retorna todo o progresso", async () => {
    const p1 = inicializarProgresso(perfilId, toExercicioId("e1"));
    const p2 = inicializarProgresso(perfilId, toExercicioId("e2"));
    await salvarProgresso(db, p1);
    await salvarProgresso(db, p2);
    const r = await listarProgressoPerfil(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBe(2);
  });
});
