import type Database from "@tauri-apps/plugin-sql";
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
  data: string;
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
  unidadeNome: string | null;
  moduloNome: string | null;
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
    const rows = await db.select<
      Array<{
        dominados: number;
        em_progresso: number;
        nao_vistos: number;
        total_tentativas: number | null;
        total_acertos: number | null;
      }>
    >(
      `SELECT
        COUNT(CASE WHEN status = 'dominado' THEN 1 END) as dominados,
        COUNT(CASE WHEN status = 'em_progresso' THEN 1 END) as em_progresso,
        COUNT(CASE WHEN status = 'nao_visto' THEN 1 END) as nao_vistos,
        SUM(total_tentativas) as total_tentativas,
        SUM(total_acertos) as total_acertos
      FROM progresso_exercicio
      WHERE perfil_id = ?`,
      [perfilId],
    );
    const statusRow = rows[0] ?? {
      dominados: 0,
      em_progresso: 0,
      nao_vistos: 0,
      total_tentativas: null,
      total_acertos: null,
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
    const rows = await db.select<Array<{ data: string; tentativas: number; acertos: number }>>(
      `SELECT
        DATE(timestamp) as data,
        COUNT(*) as tentativas,
        SUM(CASE WHEN acertou = 1 THEN 1 ELSE 0 END) as acertos
      FROM tentativas
      WHERE perfil_id = ? AND DATE(timestamp) >= ?
      GROUP BY DATE(timestamp)
      ORDER BY data ASC`,
      [perfilId, dataInicio],
    );
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
    const rows = await db.select<
      Array<{
        id: string;
        inicio: string;
        fim: string | null;
        total_tentativas: number;
        total_acertos: number;
        modo: string;
        unidade_nome: string | null;
        modulo_nome: string | null;
      }>
    >(
      `SELECT s.id, s.inicio, s.fim, s.total_tentativas, s.total_acertos, s.modo,
              u.nome as unidade_nome, m.nome as modulo_nome
       FROM sessoes s
       LEFT JOIN unidades u ON u.id = s.unidade_id
       LEFT JOIN modulos m ON m.id = u.modulo_id
       WHERE s.perfil_id = ? AND s.total_tentativas > 0
       ORDER BY s.inicio DESC LIMIT ?`,
      [perfilId, limite],
    );
    return ok(
      rows.map((r) => ({
        id: r.id,
        inicio: new Date(r.inicio),
        fim: r.fim ? new Date(r.fim) : null,
        totalTentativas: r.total_tentativas,
        totalAcertos: r.total_acertos,
        modo: r.modo,
        duracaoMs: r.fim ? new Date(r.fim).getTime() - new Date(r.inicio).getTime() : null,
        unidadeNome: r.unidade_nome,
        moduloNome: r.modulo_nome,
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
    const rows = await db.select<
      Array<{
        unidade_id: string;
        nome_unidade: string;
        total_tentativas: number;
        taxa_acerto: number;
      }>
    >(
      `SELECT
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
      LIMIT ?`,
      [perfilId, limite],
    );
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
