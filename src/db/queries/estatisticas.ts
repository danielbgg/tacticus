import type { Database } from "better-sqlite3";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { PerfilId } from "@/shared/types/branded";

export interface VisaoGeral {
  totalDominados: number;
  totalEmProgresso: number;
  totalNaoVistos: number;
  totalTentativas: number;
  totalAcertos: number;
  taxaAcerto: number;
}

export interface EntradaHeatmap {
  data: string; // ISO date YYYY-MM-DD
  tentativas: number;
  acertos: number;
}

export interface HistoricoSessao {
  id: string;
  inicio: Date;
  fim: Date | null;
  totalTentativas: number;
  totalAcertos: number;
  modo: string;
  duracaoMs: number | null;
}

export interface PontoFraco {
  unidadeId: string;
  nomeUnidade: string;
  taxaAcerto: number;
  totalTentativas: number;
}

export async function buscarVisaoGeral(
  db: Database,
  perfilId: PerfilId,
): Promise<Result<VisaoGeral, string>> {
  try {
    const statusRow = db
      .prepare(
        `
      SELECT
        COUNT(CASE WHEN status = 'dominado' THEN 1 END) as dominados,
        COUNT(CASE WHEN status = 'em_progresso' THEN 1 END) as em_progresso,
        COUNT(CASE WHEN status = 'nao_visto' THEN 1 END) as nao_vistos,
        SUM(total_tentativas) as total_tentativas,
        SUM(total_acertos) as total_acertos
      FROM progresso_exercicio
      WHERE perfil_id = ?
    `,
      )
      .get(perfilId) as {
      dominados: number;
      em_progresso: number;
      nao_vistos: number;
      total_tentativas: number | null;
      total_acertos: number | null;
    };

    const totalTentativas = statusRow.total_tentativas ?? 0;
    const totalAcertos = statusRow.total_acertos ?? 0;

    return ok({
      totalDominados: statusRow.dominados,
      totalEmProgresso: statusRow.em_progresso,
      totalNaoVistos: statusRow.nao_vistos,
      totalTentativas,
      totalAcertos,
      taxaAcerto: totalTentativas > 0 ? Math.round((totalAcertos / totalTentativas) * 100) : 0,
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar visão geral");
  }
}

export async function buscarHeatmap(
  db: Database,
  perfilId: PerfilId,
  diasAtras = 365,
): Promise<Result<EntradaHeatmap[], string>> {
  try {
    const dataInicio = new Date(Date.now() - diasAtras * 86400000).toISOString().split("T")[0]!;
    const rows = db
      .prepare(
        `
      SELECT
        DATE(timestamp) as data,
        COUNT(*) as tentativas,
        SUM(CASE WHEN acertou = 1 THEN 1 ELSE 0 END) as acertos
      FROM tentativas
      WHERE perfil_id = ? AND DATE(timestamp) >= ?
      GROUP BY DATE(timestamp)
      ORDER BY data ASC
    `,
      )
      .all(perfilId, dataInicio) as { data: string; tentativas: number; acertos: number }[];

    return ok(rows.map((r) => ({ data: r.data, tentativas: r.tentativas, acertos: r.acertos })));
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar heatmap");
  }
}

export async function buscarHistoricoSessoes(
  db: Database,
  perfilId: PerfilId,
  limite = 50,
): Promise<Result<HistoricoSessao[], string>> {
  try {
    const rows = db
      .prepare(
        `
      SELECT * FROM sessoes
      WHERE perfil_id = ?
      ORDER BY inicio DESC
      LIMIT ?
    `,
      )
      .all(perfilId, limite) as {
      id: string;
      inicio: string;
      fim: string | null;
      total_tentativas: number;
      total_acertos: number;
      modo: string;
    }[];

    return ok(
      rows.map((r) => ({
        id: r.id,
        inicio: new Date(r.inicio),
        fim: r.fim ? new Date(r.fim) : null,
        totalTentativas: r.total_tentativas,
        totalAcertos: r.total_acertos,
        modo: r.modo,
        duracaoMs: r.fim ? new Date(r.fim).getTime() - new Date(r.inicio).getTime() : null,
      })),
    );
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar histórico");
  }
}

export async function buscarPontosFracos(
  db: Database,
  perfilId: PerfilId,
  limite = 5,
): Promise<Result<PontoFraco[], string>> {
  try {
    const rows = db
      .prepare(
        `
      SELECT
        e.unidade_id,
        u.nome as nome_unidade,
        COUNT(t.id) as total_tentativas,
        SUM(CASE WHEN t.acertou = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(t.id) as taxa_acerto
      FROM tentativas t
      JOIN exercicios e ON t.exercicio_id = e.id
      JOIN unidades u ON e.unidade_id = u.id
      WHERE t.perfil_id = ?
      GROUP BY e.unidade_id
      HAVING total_tentativas >= 5
      ORDER BY taxa_acerto ASC
      LIMIT ?
    `,
      )
      .all(perfilId, limite) as {
      unidade_id: string;
      nome_unidade: string;
      total_tentativas: number;
      taxa_acerto: number;
    }[];

    return ok(
      rows.map((r) => ({
        unidadeId: r.unidade_id,
        nomeUnidade: r.nome_unidade,
        taxaAcerto: Math.round(r.taxa_acerto),
        totalTentativas: r.total_tentativas,
      })),
    );
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar pontos fracos");
  }
}
