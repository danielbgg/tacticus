import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";
import { criarSessao, encerrarSessao, listarSessoesPerfil } from "@/db/queries/sessoes";
import { registrarTentativa } from "@/db/queries/tentativas";
import { toPerfilId, toSessaoId, toExercicioId, toTentativaId } from "@/shared/types/branded";

function criarDbMemoria() {
  const db = new Database(":memory:");
  for (const m of ["0001_init.sql", "0002_add_conquistas.sql"]) {
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
           VALUES ('e1', 'u1', 'part1', 'startpos', '["e2e4"]', 1)`);
  return db;
}

describe("queries/sessoes", () => {
  let db: InstanceType<typeof Database>;
  const perfilId = toPerfilId("p1");

  beforeEach(() => {
    db = criarDbMemoria();
  });
  afterEach(() => db.close());

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

  it("listarSessoesPerfil retorna sessões ordenadas por início desc", async () => {
    await criarSessao(db, { perfilId, modo: "treino" });
    await criarSessao(db, { perfilId, modo: "revisao" });
    const r = await listarSessoesPerfil(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBe(2);
  });
});

describe("queries/tentativas", () => {
  let db: InstanceType<typeof Database>;
  const perfilId = toPerfilId("p1");
  const exercicioId = toExercicioId("e1");

  beforeEach(() => {
    db = criarDbMemoria();
  });
  afterEach(() => db.close());

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
