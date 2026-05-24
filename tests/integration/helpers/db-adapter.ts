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

export function criarDbMemoria(seed?: (db: Database) => void): Database {
  const db = new Database(":memory:");
  for (const m of ["0001_init.sql", "0002_add_conquistas.sql"]) {
    db.exec(readFileSync(join(__dirname, "../../../src/db/migrations", m), "utf-8"));
  }
  if (seed) seed(db);
  return db;
}
