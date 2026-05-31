import { Database } from "node-sqlite3-wasm";
import { readFileSync } from "fs";
import { join } from "path";
import type TauriDatabase from "@tauri-apps/plugin-sql";

export function adaptDb(db: Database): typeof TauriDatabase.prototype {
  return {
    path: ":memory:",
    async execute(sql: string, params?: unknown[]) {
      const stmt = db.prepare(sql);
      const result = params ? stmt.run(params as never) : stmt.run();
      stmt.finalize();
      return { lastInsertId: Number(result.lastInsertRowid), rowsAffected: result.changes };
    },
    async select<T>(sql: string, params?: unknown[]): Promise<T> {
      const stmt = db.prepare(sql);
      const rows = params ? stmt.all(params as never) : stmt.all();
      stmt.finalize();
      return rows as T;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

// Migrações de schema (DDL). As de dados (0003/0004/0006/0007) são omitidas para
// manter os testes rápidos — cada suite faz seu próprio seed mínimo.
// DDL inline retirado de migrações de dados:
//   0007_circles_v2.sql → ALTER TABLE exercicios ADD COLUMN temas TEXT
const SCHEMA_MIGRATIONS = [
  "0001_init.sql",
  "0002_add_conquistas.sql",
  "0005_sessoes_pausadas.sql",
  "0008_sessao_unidade.sql",
  "0012_elo_favoritos_meta.sql",
];

export function criarDbMemoria(seed?: (db: Database) => void): Database {
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  for (const m of SCHEMA_MIGRATIONS) {
    db.exec(readFileSync(join(__dirname, "../../../src/db/migrations", m), "utf-8"));
  }
  // Coluna adicionada em 0007 (arquivo de dados — não carregado integralmente)
  db.exec("ALTER TABLE exercicios ADD COLUMN temas TEXT");
  if (seed) seed(db);
  return db;
}
