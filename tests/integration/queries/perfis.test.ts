import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "node-sqlite3-wasm";
import { readFileSync } from "fs";
import { join } from "path";
import { toPerfilId } from "@/shared/types/branded";
import {
  listarPerfis,
  buscarPerfil,
  criarPerfil,
  atualizarUltimoAcesso,
  excluirPerfil,
} from "@/db/queries/perfis";
import { adaptDb } from "../helpers/db-adapter";

function criarDbMemoria() {
  const db = new Database(":memory:");
  for (const m of ["0001_init.sql", "0002_add_conquistas.sql"]) {
    db.exec(readFileSync(join(__dirname, "../../../src/db/migrations", m), "utf-8"));
  }
  return db;
}

describe("queries/perfis — integração SQLite in-memory", () => {
  let raw: InstanceType<typeof Database>;
  let db: ReturnType<typeof adaptDb>;

  beforeEach(() => {
    raw = criarDbMemoria();
    db = adaptDb(raw);
  });
  afterEach(() => raw.close());

  describe("criarPerfil", () => {
    it("insere perfil com campos obrigatórios", async () => {
      const resultado = await criarPerfil(db, {
        nome: "Daniel",
        nivel: "intermediario",
        avatar: "♞",
        acertosParaDominar: 5,
      });
      expect(resultado.ok).toBe(true);
      if (resultado.ok) {
        expect(resultado.value.nome).toBe("Daniel");
        expect(resultado.value.nivel).toBe("intermediario");
        expect(resultado.value.avatar).toBe("♞");
        expect(resultado.value.id).toBeTruthy();
      }
    });

    it("gera UUID único para cada perfil", async () => {
      const r1 = await criarPerfil(db, {
        nome: "A",
        nivel: "iniciante",
        avatar: "♙",
        acertosParaDominar: 5,
      });
      const r2 = await criarPerfil(db, {
        nome: "B",
        nivel: "iniciante",
        avatar: "♙",
        acertosParaDominar: 5,
      });
      expect(r1.ok && r2.ok && r1.value.id !== r2.value.id).toBe(true);
    });

    it("retorna erro ao duplicar nome", async () => {
      await criarPerfil(db, {
        nome: "Daniel",
        nivel: "iniciante",
        avatar: "♙",
        acertosParaDominar: 5,
      });
      const resultado = await criarPerfil(db, {
        nome: "Daniel",
        nivel: "avancado",
        avatar: "♟",
        acertosParaDominar: 5,
      });
      expect(resultado.ok).toBe(false);
    });
  });

  describe("listarPerfis", () => {
    it("retorna lista vazia quando não há perfis", async () => {
      const resultado = await listarPerfis(db);
      expect(resultado.ok).toBe(true);
      if (resultado.ok) expect(resultado.value).toHaveLength(0);
    });

    it("retorna todos os perfis", async () => {
      await criarPerfil(db, {
        nome: "Alice",
        nivel: "iniciante",
        avatar: "♙",
        acertosParaDominar: 5,
      });
      await criarPerfil(db, { nome: "Bob", nivel: "avancado", avatar: "♟", acertosParaDominar: 7 });
      const resultado = await listarPerfis(db);
      expect(resultado.ok).toBe(true);
      if (resultado.ok) expect(resultado.value).toHaveLength(2);
    });
  });

  describe("buscarPerfil", () => {
    it("retorna perfil por id", async () => {
      const criado = await criarPerfil(db, {
        nome: "Carol",
        nivel: "intermediario",
        avatar: "♜",
        acertosParaDominar: 5,
      });
      if (!criado.ok) throw new Error("falhou ao criar");
      const resultado = await buscarPerfil(db, criado.value.id);
      expect(resultado.ok).toBe(true);
      if (resultado.ok) expect(resultado.value?.nome).toBe("Carol");
    });

    it("retorna null para id inexistente", async () => {
      const resultado = await buscarPerfil(db, toPerfilId("nao-existe"));
      expect(resultado.ok).toBe(true);
      if (resultado.ok) expect(resultado.value).toBeNull();
    });
  });

  describe("atualizarUltimoAcesso", () => {
    it("atualiza timestamp de ultimo_acesso", async () => {
      const criado = await criarPerfil(db, {
        nome: "Eva",
        nivel: "iniciante",
        avatar: "♕",
        acertosParaDominar: 5,
      });
      if (!criado.ok) throw new Error("falhou ao criar");
      const antes = criado.value.ultimoAcesso;
      await new Promise((r) => setTimeout(r, 10));
      await atualizarUltimoAcesso(db, criado.value.id);
      const depois = await buscarPerfil(db, criado.value.id);
      if (depois.ok && depois.value) {
        expect(depois.value.ultimoAcesso.getTime()).toBeGreaterThan(antes.getTime());
      }
    });
  });

  describe("excluirPerfil", () => {
    it("remove perfil existente", async () => {
      const criado = await criarPerfil(db, {
        nome: "Fred",
        nivel: "iniciante",
        avatar: "♗",
        acertosParaDominar: 5,
      });
      if (!criado.ok) throw new Error("falhou ao criar");
      await excluirPerfil(db, criado.value.id);
      const depois = await buscarPerfil(db, criado.value.id);
      expect(depois.ok).toBe(true);
      if (depois.ok) expect(depois.value).toBeNull();
    });
  });
});
