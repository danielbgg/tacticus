import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "node-sqlite3-wasm";
import { toPerfilId } from "@/shared/types/branded";
import {
  listarPerfis,
  buscarPerfil,
  criarPerfil,
  atualizarUltimoAcesso,
  excluirPerfil,
} from "@/db/queries/perfis";
import { adaptDb, criarDbMemoria as criarDbBase } from "../helpers/db-adapter";
import { criarSessao } from "@/db/queries/sessoes";
import { registrarTentativa } from "@/db/queries/tentativas";
import { toExercicioId } from "@/shared/types/branded";

function criarDbMemoria() {
  return criarDbBase();
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

    it("exclui sessões e tentativas relacionadas via CASCADE", async () => {
      // Configura estrutura mínima necessária para criar tentativas
      raw.exec(`INSERT INTO areas (id, nome, ordem) VALUES ('a1', 'T', 1)`);
      raw.exec(`INSERT INTO modulos (id, area_id, nome, ordem) VALUES ('m1', 'a1', 'M', 1)`);
      raw.exec(`INSERT INTO unidades (id, modulo_id, nome, ordem) VALUES ('u1', 'm1', 'U', 1)`);
      raw.exec(
        `INSERT INTO partidas (id, brancas, negras, resultado, ano) VALUES ('p1', 'A', 'B', '1-0', 2000)`,
      );
      raw.exec(`INSERT INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, ordem)
                VALUES ('e1', 'u1', 'p1', 'startpos', '["e2e4"]', 1)`);

      const criado = await criarPerfil(db, {
        nome: "Gustavo",
        nivel: "iniciante",
        avatar: "♘",
        acertosParaDominar: 5,
      });
      if (!criado.ok) throw new Error("falhou ao criar perfil");
      const perfilId = criado.value.id;

      const sessao = await criarSessao(db, { perfilId, modo: "treino" });
      if (!sessao.ok) throw new Error("falhou ao criar sessão");

      await registrarTentativa(db, {
        sessaoId: sessao.value.id,
        perfilId,
        exercicioId: toExercicioId("e1"),
        acertou: true,
        tempoRespostaMs: 2000,
        dicasUsadas: 0,
      });

      await excluirPerfil(db, perfilId);

      // Cascata: sessões e tentativas devem ter sido removidas
      const sessoes = raw
        .prepare("SELECT COUNT(*) as n FROM sessoes WHERE perfil_id = ?")
        .get([perfilId]) as { n: number };
      const tentativas = raw
        .prepare("SELECT COUNT(*) as n FROM tentativas WHERE perfil_id = ?")
        .get([perfilId]) as { n: number };

      expect(sessoes.n).toBe(0);
      expect(tentativas.n).toBe(0);
    });
  });
});
