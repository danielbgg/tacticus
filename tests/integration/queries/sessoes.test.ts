import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "node-sqlite3-wasm";
import { adaptDb, criarDbMemoria as criarDbBase } from "../helpers/db-adapter";
import { criarSessao, encerrarSessao, listarSessoesPerfil } from "@/db/queries/sessoes";
import { registrarTentativa } from "@/db/queries/tentativas";
import { toPerfilId, toExercicioId } from "@/shared/types/branded";

function criarDbMemoria() {
  return criarDbBase((db) => {
    db.exec(`INSERT INTO perfis (id, nome, nivel, avatar, acertos_para_dominar, criado_em, ultimo_acesso)
             VALUES ('p1', 'Teste', 'iniciante', '♙', 5, datetime('now'), datetime('now'))`);
    db.exec(`INSERT INTO areas (id, nome, ordem) VALUES ('a1', 'Táticas', 1)`);
    db.exec(`INSERT INTO modulos (id, area_id, nome, ordem) VALUES ('m1', 'a1', 'Mod', 1)`);
    db.exec(`INSERT INTO unidades (id, modulo_id, nome, ordem) VALUES ('u1', 'm1', 'Unid', 1)`);
    db.exec(
      `INSERT INTO partidas (id, brancas, negras, resultado, ano) VALUES ('part1', 'A', 'B', '1-0', 2000)`,
    );
    db.exec(`INSERT INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, ordem)
             VALUES ('e1', 'u1', 'part1', 'startpos', '["e2e4"]', 1)`);
  });
}

describe("queries/sessoes", () => {
  let raw: InstanceType<typeof Database>;
  let db: ReturnType<typeof adaptDb>;
  const perfilId = toPerfilId("p1");

  beforeEach(() => {
    raw = criarDbMemoria();
    db = adaptDb(raw);
  });
  afterEach(() => raw.close());

  it("criarSessao persiste com modo correto", async () => {
    const r = await criarSessao(db, { perfilId, modo: "treino" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.modo).toBe("treino");
      expect(r.value.id).toBeTruthy();
    }
  });

  it("encerrarSessao define fim e totais", async () => {
    const criado = await criarSessao(db, { perfilId, modo: "treino" });
    if (!criado.ok) throw new Error("falhou criar");
    const r = await encerrarSessao(db, criado.value.id, { totalTentativas: 10, totalAcertos: 7 });
    expect(r.ok).toBe(true);
  });

  it("listarSessoesPerfil retorna sessões", async () => {
    await criarSessao(db, { perfilId, modo: "treino" });
    await criarSessao(db, { perfilId, modo: "revisao" });
    const r = await listarSessoesPerfil(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBe(2);
  });
});

describe("queries/tentativas", () => {
  let raw: InstanceType<typeof Database>;
  let db: ReturnType<typeof adaptDb>;
  const perfilId = toPerfilId("p1");
  const exercicioId = toExercicioId("e1");

  beforeEach(() => {
    raw = criarDbMemoria();
    db = adaptDb(raw);
  });
  afterEach(() => raw.close());

  it("registrarTentativa persiste acerto", async () => {
    const sessao = await criarSessao(db, { perfilId, modo: "treino" });
    if (!sessao.ok) throw new Error("falhou criar sessão");
    const r = await registrarTentativa(db, {
      sessaoId: sessao.value.id,
      perfilId,
      exercicioId,
      acertou: true,
      tempoRespostaMs: 3000,
      dicasUsadas: 0,
    });
    expect(r.ok).toBe(true);
  });

  it("registrarTentativa persiste erro com dicas", async () => {
    const sessao = await criarSessao(db, { perfilId, modo: "treino" });
    if (!sessao.ok) throw new Error("falhou criar sessão");
    const r = await registrarTentativa(db, {
      sessaoId: sessao.value.id,
      perfilId,
      exercicioId,
      acertou: false,
      tempoRespostaMs: 15000,
      dicasUsadas: 2,
    });
    expect(r.ok).toBe(true);
  });
});
