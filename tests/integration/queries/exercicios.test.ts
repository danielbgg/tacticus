import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "node-sqlite3-wasm";
import { adaptDb, criarDbMemoria as criarDbBase } from "../helpers/db-adapter";
import {
  listarExercicios,
  buscarExercicio,
  listarExerciciosDaUnidade,
} from "@/db/queries/exercicios";
import {
  buscarProgressoExercicio,
  listarExerciciosParaRevisao,
  salvarProgresso,
} from "@/db/queries/progresso";
import { toExercicioId, toPerfilId, toUnidadeId } from "@/shared/types/branded";
import { inicializarProgresso } from "@/shared/lib/sm2";

function criarDbMemoria() {
  return criarDbBase();
}

function seedDados(db: InstanceType<typeof Database>) {
  db.exec(`
    INSERT INTO areas (id, nome, ordem) VALUES ('area-1', 'Táticas', 1);
    INSERT INTO modulos (id, area_id, nome, ordem) VALUES ('mod-1', 'area-1', 'Módulo 1', 1);
    INSERT INTO unidades (id, modulo_id, nome, ordem) VALUES ('unid-1', 'mod-1', 'Unidade 1', 1);
    INSERT INTO partidas (id, brancas, negras, resultado, ano, pgn)
      VALUES ('part-1', 'Kasparov', 'Karpov', '1-0', 1985, '*');
    INSERT INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, ordem)
      VALUES
        ('ex-1', 'unid-1', 'part-1', 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', '["e7e5"]', 1),
        ('ex-2', 'unid-1', 'part-1', 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2', '["g1f3"]', 2);
  `);
}

describe("queries/exercicios", () => {
  let raw: InstanceType<typeof Database>;
  let db: ReturnType<typeof adaptDb>;

  beforeEach(() => {
    raw = criarDbMemoria();
    seedDados(raw);
    db = adaptDb(raw);
  });
  afterEach(() => raw.close());

  it("listarExercicios retorna todos os exercícios", async () => {
    const r = await listarExercicios(db);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBe(2);
  });

  it("listarExerciciosDaUnidade filtra por unidade", async () => {
    const r = await listarExerciciosDaUnidade(db, toUnidadeId("unid-1"));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.length).toBe(2);
      expect(r.value[0]?.ordem).toBe(1);
    }
  });

  it("buscarExercicio retorna null para id inexistente", async () => {
    const r = await buscarExercicio(db, toExercicioId("nao-existe"));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeNull();
  });

  it("buscarExercicio inclui dados da partida de origem", async () => {
    const r = await buscarExercicio(db, toExercicioId("ex-1"));
    expect(r.ok).toBe(true);
    if (r.ok && r.value) {
      expect(r.value.partida.brancas).toBe("Kasparov");
      expect(r.value.partida.negras).toBe("Karpov");
    }
  });
});

describe("queries/progresso", () => {
  let raw: InstanceType<typeof Database>;
  let db: ReturnType<typeof adaptDb>;
  const perfilId = toPerfilId("perfil-teste");
  const exercicioId = toExercicioId("ex-1");

  beforeEach(() => {
    raw = criarDbMemoria();
    seedDados(raw);
    raw.exec(`INSERT INTO perfis (id, nome, nivel, avatar, acertos_para_dominar, criado_em, ultimo_acesso)
              VALUES ('perfil-teste', 'Teste', 'iniciante', '♙', 5, datetime('now'), datetime('now'))`);
    db = adaptDb(raw);
  });
  afterEach(() => raw.close());

  it("buscarProgressoExercicio retorna null para exercício sem progresso", async () => {
    const r = await buscarProgressoExercicio(db, perfilId, exercicioId);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeNull();
  });

  it("salvarProgresso persiste e recupera progresso", async () => {
    const progresso = inicializarProgresso(perfilId, exercicioId);
    await salvarProgresso(db, progresso);
    const r = await buscarProgressoExercicio(db, perfilId, exercicioId);
    expect(r.ok).toBe(true);
    if (r.ok && r.value) {
      expect(r.value.acertosConsecutivos).toBe(0);
      expect(r.value.status).toBe("nao_visto");
    }
  });

  it("listarExerciciosParaRevisao filtra por data de revisão", async () => {
    const progresso = {
      ...inicializarProgresso(perfilId, exercicioId),
      status: "dominado" as const,
      proximaRevisao: new Date(Date.now() - 86400000),
    };
    await salvarProgresso(db, progresso);
    const r = await listarExerciciosParaRevisao(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBeGreaterThanOrEqual(1);
  });
});
