declare module "better-sqlite3" {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): RunResult;
  }

  class Database {
    constructor(filename: string, options?: { memory?: boolean; readonly?: boolean });
    prepare(sql: string): Statement;
    exec(sql: string): this;
    close(): void;
    transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T;
  }

  export default Database;
  export { Database };
}
