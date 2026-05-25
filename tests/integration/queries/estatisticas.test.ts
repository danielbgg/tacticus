import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Database } from "node-sqlite3-wasm";
import { adaptDb, criarDbMemoria as criarDbBase } from "../helpers/db-adapter";
import {
  buscarVisaoGeral,
  buscarHeatmap,
  buscarHistoricoSessoes,
  buscarPontosFracos,
} from "@/db/queries/estatisticas";
import { criarSessao, encerrarSessao } from "@/db/queries/sessoes";
import { registrarTentativa } from "@/db/queries/tentativas";
import { salvarProgresso } from "@/db/queries/progresso";
import { inicializarProgresso, calcularProximaRevisao } from "@/shared/lib/sm2";
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
             VALUES ('e1', 'u1', 'part1', 'startpos', '["e2e4"]', 1),
                    ('e2', 'u1', 'part1', 'startpos', '["d2d4"]', 2),
                    ('e3', 'u1', 'part1', 'startpos', '["c2c4"]', 3)`);
  });
}

describe("queries/estatisticas", () => {
  let raw: InstanceType<typeof Database>;
  let db: ReturnType<typeof adaptDb>;
  const perfilId = toPerfilId("p1");

  beforeEach(() => {
    raw = criarDbMemoria();
    db = adaptDb(raw);
  });
  afterEach(() => raw.close());

  // ── buscarVisaoGeral ──────────────────────────────────────────────────────

  it("buscarVisaoGeral retorna zeros quando sem progresso", async () => {
    const r = await buscarVisaoGeral(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.totalDominados).toBe(0);
      expect(r.value.totalEmProgresso).toBe(0);
      expect(r.value.taxaAcerto).toBe(0);
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

  // ── buscarHeatmap ─────────────────────────────────────────────────────────

  it("buscarHeatmap retorna entradas por data após registrar tentativa", async () => {
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
    const r = await buscarHeatmap(db, perfilId, 30);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBe(1);
  });

  // ── buscarHistoricoSessoes ────────────────────────────────────────────────

  it("buscarHistoricoSessoes retorna sessão com tentativas registradas", async () => {
    const s = await criarSessao(db, { perfilId, modo: "treino" });
    if (!s.ok) throw new Error("falhou criar sessão");
    await registrarTentativa(db, {
      sessaoId: s.value.id,
      perfilId,
      exercicioId: toExercicioId("e1"),
      acertou: true,
      tempoRespostaMs: 2000,
      dicasUsadas: 0,
    });
    await encerrarSessao(db, s.value.id, { totalTentativas: 1, totalAcertos: 1 });
    const r = await buscarHistoricoSessoes(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.length).toBe(1);
      expect(r.value[0]!.totalTentativas).toBe(1);
      expect(r.value[0]!.totalAcertos).toBe(1);
    }
  });

  it("buscarHistoricoSessoes retorna sessão MESMO SEM chamar encerrarSessao", async () => {
    // Valida a correção do bug: histórico deve aparecer mesmo que encerrarSessao
    // não tenha sido chamado (ex: o usuário fechou o app abruptamente)
    const s = await criarSessao(db, { perfilId, modo: "treino" });
    if (!s.ok) throw new Error("falhou criar sessão");
    await registrarTentativa(db, {
      sessaoId: s.value.id,
      perfilId,
      exercicioId: toExercicioId("e1"),
      acertou: false,
      tempoRespostaMs: 5000,
      dicasUsadas: 1,
    });
    await registrarTentativa(db, {
      sessaoId: s.value.id,
      perfilId,
      exercicioId: toExercicioId("e2"),
      acertou: true,
      tempoRespostaMs: 3000,
      dicasUsadas: 0,
    });
    // Nenhuma chamada a encerrarSessao — simula fechamento abrupto do app
    const r = await buscarHistoricoSessoes(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.length).toBe(1);
      expect(r.value[0]!.totalTentativas).toBe(2);
      expect(r.value[0]!.totalAcertos).toBe(1);
    }
  });

  it("buscarHistoricoSessoes NÃO retorna sessão sem nenhuma tentativa", async () => {
    // Sessão criada mas nenhum exercício foi feito — não deve aparecer no histórico
    await criarSessao(db, { perfilId, modo: "treino" });
    const r = await buscarHistoricoSessoes(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBe(0);
  });

  it("buscarHistoricoSessoes conta acertos e erros separados corretamente", async () => {
    const s = await criarSessao(db, { perfilId, modo: "treino" });
    if (!s.ok) throw new Error("falhou criar sessão");
    await registrarTentativa(db, {
      sessaoId: s.value.id,
      perfilId,
      exercicioId: toExercicioId("e1"),
      acertou: true,
      tempoRespostaMs: 1000,
      dicasUsadas: 0,
    });
    await registrarTentativa(db, {
      sessaoId: s.value.id,
      perfilId,
      exercicioId: toExercicioId("e2"),
      acertou: false,
      tempoRespostaMs: 8000,
      dicasUsadas: 2,
    });
    await registrarTentativa(db, {
      sessaoId: s.value.id,
      perfilId,
      exercicioId: toExercicioId("e3"),
      acertou: true,
      tempoRespostaMs: 2000,
      dicasUsadas: 0,
    });
    const r = await buscarHistoricoSessoes(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value[0]!.totalTentativas).toBe(3);
      expect(r.value[0]!.totalAcertos).toBe(2);
    }
  });

  it("buscarHistoricoSessoes retorna sessões mais recentes primeiro", async () => {
    for (const exercicioId of ["e1", "e2"] as const) {
      const s = await criarSessao(db, { perfilId, modo: "treino" });
      if (!s.ok) throw new Error();
      await registrarTentativa(db, {
        sessaoId: s.value.id,
        perfilId,
        exercicioId: toExercicioId(exercicioId),
        acertou: true,
        tempoRespostaMs: 1000,
        dicasUsadas: 0,
      });
    }
    const r = await buscarHistoricoSessoes(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.length).toBe(2);
      expect(r.value[0]!.inicio.getTime()).toBeGreaterThanOrEqual(r.value[1]!.inicio.getTime());
    }
  });

  // ── buscarPontosFracos ────────────────────────────────────────────────────

  it("buscarPontosFracos retorna lista vazia sem tentativas suficientes", async () => {
    // Menos de 5 tentativas por unidade — não deve aparecer
    const s = await criarSessao(db, { perfilId, modo: "treino" });
    if (!s.ok) throw new Error();
    await registrarTentativa(db, {
      sessaoId: s.value.id,
      perfilId,
      exercicioId: toExercicioId("e1"),
      acertou: false,
      tempoRespostaMs: 5000,
      dicasUsadas: 0,
    });
    const r = await buscarPontosFracos(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.length).toBe(0);
  });

  it("buscarPontosFracos lista unidade com baixa taxa de acerto após >= 5 tentativas", async () => {
    const s = await criarSessao(db, { perfilId, modo: "treino" });
    if (!s.ok) throw new Error();
    // 5 tentativas, 1 acerto = 20% de taxa
    for (let i = 0; i < 4; i++) {
      await registrarTentativa(db, {
        sessaoId: s.value.id,
        perfilId,
        exercicioId: toExercicioId("e1"),
        acertou: false,
        tempoRespostaMs: 5000,
        dicasUsadas: 0,
      });
    }
    await registrarTentativa(db, {
      sessaoId: s.value.id,
      perfilId,
      exercicioId: toExercicioId("e1"),
      acertou: true,
      tempoRespostaMs: 3000,
      dicasUsadas: 0,
    });
    const r = await buscarPontosFracos(db, perfilId);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.length).toBe(1);
      expect(r.value[0]!.taxaAcerto).toBe(20);
      expect(r.value[0]!.totalTentativas).toBe(5);
    }
  });
});
