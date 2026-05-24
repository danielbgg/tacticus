import type Database from "@tauri-apps/plugin-sql";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";
import type { ConfiguracoesPerfil } from "@/shared/types/domain";
import type { PerfilId } from "@/shared/types/branded";

interface ConfiguracoesRow {
  perfil_id: string;
  tema: string;
  estilo_tabuleiro: string;
  conjunto_pecas: string;
  animacao_lances: string;
  som_habilitado: number;
  modo_daltonico: number;
  idioma: string;
}

function rowParaConfiguracoes(row: ConfiguracoesRow): ConfiguracoesPerfil {
  return {
    perfilId: row.perfil_id as PerfilId,
    tema: row.tema as ConfiguracoesPerfil["tema"],
    estiloTabuleiro: row.estilo_tabuleiro as ConfiguracoesPerfil["estiloTabuleiro"],
    conjuntoPecas: row.conjunto_pecas as ConfiguracoesPerfil["conjuntoPecas"],
    animacaoLances: row.animacao_lances as ConfiguracoesPerfil["animacaoLances"],
    somHabilitado: Boolean(row.som_habilitado),
    modoDaltonico: Boolean(row.modo_daltonico),
    idioma: row.idioma as ConfiguracoesPerfil["idioma"],
  };
}

export async function buscarConfiguracoes(
  db: Database,
  perfilId: PerfilId,
): Promise<Result<ConfiguracoesPerfil | null, string>> {
  try {
    const rows = await db.select<ConfiguracoesRow[]>(
      "SELECT * FROM configuracoes_perfil WHERE perfil_id = ?",
      [perfilId],
    );
    const row = rows[0];
    return ok(row ? rowParaConfiguracoes(row) : null);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao buscar configurações");
  }
}

export async function salvarConfiguracoes(
  db: Database,
  config: ConfiguracoesPerfil,
): Promise<Result<ConfiguracoesPerfil, string>> {
  try {
    await db.execute(
      `INSERT INTO configuracoes_perfil
         (perfil_id, tema, estilo_tabuleiro, conjunto_pecas, animacao_lances, som_habilitado, modo_daltonico, idioma)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(perfil_id) DO UPDATE SET
         tema = excluded.tema,
         estilo_tabuleiro = excluded.estilo_tabuleiro,
         conjunto_pecas = excluded.conjunto_pecas,
         animacao_lances = excluded.animacao_lances,
         som_habilitado = excluded.som_habilitado,
         modo_daltonico = excluded.modo_daltonico,
         idioma = excluded.idioma`,
      [
        config.perfilId,
        config.tema,
        config.estiloTabuleiro,
        config.conjuntoPecas,
        config.animacaoLances,
        config.somHabilitado ? 1 : 0,
        config.modoDaltonico ? 1 : 0,
        config.idioma,
      ],
    );
    return ok(config);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Erro ao salvar configurações");
  }
}
