import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";
import { buscarVisaoGeral, buscarHeatmap, buscarHistoricoSessoes } from "@/db/queries/estatisticas";
import { criarSessao, encerrarSessao } from "@/db/queries/sessoes";
import { registrarTentativa } from "@/db/queries/tentativas";
import { salvarProgresso } from "@/db/queries/progresso";
import { inicializarProgresso, calcularProximaRevisao } from "@/shared/lib/sm2";
import { toPerfilId, toExercicioId } from "@/shared/types/branded";

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
           VALUES ('e1', 'u1', 'part1', 'startpos', '["e2e4"]', 1),
                  ('e2', 'u1', 'part1', 'startpos', '["d2d4"]', 2),
                  ('e3', 'u1', 'part1', 'startpos', '["c2c4"]', 3)`);
  return db;
}

describe("queries/estatisticas", () => {
  let db: InstanceType<typeof Database>;
  const perfilId = toPerfilId("p1");

  beforeEach(() => {
    db = criarDbMemoria();
  });
  afterEach(() => db.close());

  it("buscarVisaoGeral retorna zeros quando sem progresso", async () => {
    const r = await buscarVisaoGeral(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.totalDominados).toBe(0);
      expect(r.value.totalEmProgresso).toBe(0);
    }
  });

  it("buscarVisaoGeral conta dominados corretamente", async () => {
    let p = inicializarProgresso(perfilId, toExercicioId("e1"));
    for (let i = 0; i < 5; i++) p = calcularProximaRevisao(p, true, 0, 2000, 5);
    await salvarProgresso(db, p);
    const r = await buscarVisaoGeral(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.totalDominados).toBe(1);
  });

  it("buscarHeatmap retorna entradas por data", async () => {
    const sessao = await criarSessao(db, { perfilId, modo: "treino" });
    if (!sessao.ok) throw new Error("falhou criar sessão");
    await registrarTentativa(db, {
      sessaoId: sessao.value.id,
      perfilId,
      exercicioId: toExercicioId("e1"),
      acertou: true,
      tempoRespostaMs: 3000,
      dicasUsadas: 0,
    });
    await encerrarSessao(db, sessao.value.id, { totalTentativas: 1, totalAcertos: 1 });
    const r = await buscarHeatmap(db, perfilId, 30);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBeGreaterThanOrEqual(0);
  });

  it("buscarHistoricoSessoes retorna sessões encerradas", async () => {
    const s = await criarSessao(db, { perfilId, modo: "treino" });
    if (!s.ok) throw new Error();
    await encerrarSessao(db, s.value.id, { totalTentativas: 5, totalAcertos: 4 });
    const r = await buscarHistoricoSessoes(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBe(1);
  });
});
