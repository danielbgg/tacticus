import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "node-sqlite3-wasm";
import { readFileSync } from "fs";
import { join } from "path";
import { adaptDb } from "../helpers/db-adapter";
import { buscarPartida, buscarPartidasFiltradas } from "@/db/queries/partidas";
import { toPartidaId } from "@/shared/types/branded";

function criarDbMemoria() {
  const db = new Database(":memory:");
  for (const m of ["0001_init.sql", "0002_add_conquistas.sql"]) {
    db.exec(readFileSync(join(__dirname, "../../../src/db/migrations", m), "utf-8"));
  }
  db.exec(`INSERT INTO partidas (id, brancas, negras, elo_brancas, elo_negras, evento, ano, resultado, eco, pgn)
           VALUES
             ('p1', 'Kasparov', 'Karpov', 2850, 2720, 'World Championship', 1985, '1-0', 'B44',
              '[Event "WC"][White "Kasparov"][Black "Karpov"] 1. e4 e5 2. Nf3 *'),
             ('p2', 'Tal', 'Botvinnik', 2740, 2800, 'World Championship', 1960, '1-0', 'E69', null),
             ('p3', 'Fischer', 'Spassky', 2785, 2660, 'World Championship', 1972, '1-0', 'D59', null)`);
  return db;
}

describe("queries/partidas", () => {
  let raw: InstanceType<typeof Database>;
  let db: ReturnType<typeof adaptDb>;

  beforeEach(() => {
    raw = criarDbMemoria();
    db = adaptDb(raw);
  });
  afterEach(() => raw.close());

  it("buscarPartida retorna partida por id", async () => {
    const r = await buscarPartida(db, toPartidaId("p1"));
    expect(r.ok).toBe(true);
    if (r.ok && r.value) {
      expect(r.value.brancas).toBe("Kasparov");
      expect(r.value.negras).toBe("Karpov");
      expect(r.value.eco).toBe("B44");
    }
  });

  it("buscarPartida retorna null para id inexistente", async () => {
    const r = await buscarPartida(db, toPartidaId("nao-existe"));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBeNull();
  });

  it("buscarPartidasFiltradas por jogador", async () => {
    const r = await buscarPartidasFiltradas(db, { jogador: "Kasparov" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBe(1);
  });

  it("buscarPartidasFiltradas por eco", async () => {
    const r = await buscarPartidasFiltradas(db, { eco: "D59" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBe(1);
  });

  it("buscarPartidasFiltradas por faixa de ano", async () => {
    const r = await buscarPartidasFiltradas(db, { anoMin: 1960, anoMax: 1972 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBe(2);
  });

  it("buscarPartidasFiltradas sem filtro retorna todas", async () => {
    const r = await buscarPartidasFiltradas(db, {});
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBe(3);
  });
});
