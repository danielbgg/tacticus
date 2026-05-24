import Database from "@tauri-apps/plugin-sql";
import type { Result, DbError } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (_db) return _db;
  _db = await Database.load("sqlite:personal-chess-trainer.db");
  await runMigrations(_db);
  return _db;
}

const MIGRATIONS = [
  () => import("./migrations/0001_init.sql?raw").then((m) => m.default),
  () => import("./migrations/0002_add_conquistas.sql?raw").then((m) => m.default),
];

async function runMigrations(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id      INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = await db.select<{ id: number }[]>("SELECT id FROM _migrations");
  const appliedIds = new Set(applied.map((r) => r.id));

  for (let i = 0; i < MIGRATIONS.length; i++) {
    const migrationId = i + 1;
    if (appliedIds.has(migrationId)) continue;

    const sql = await MIGRATIONS[i]!();
    await db.execute(sql);
    await db.execute("INSERT INTO _migrations (id, applied_at) VALUES (?, ?)", [
      migrationId,
      new Date().toISOString(),
    ]);
  }
}

export async function dbExecute<T>(fn: (db: Database) => Promise<T>): Promise<Result<T, DbError>> {
  try {
    const db = await getDb();
    const result = await fn(db);
    return ok(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return err({ code: "DB_ERROR", message });
  }
}
