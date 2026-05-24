-- Migration: 0005_sessoes_pausadas

CREATE TABLE IF NOT EXISTS sessoes_pausadas (
  perfil_id    TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  unidade_id   TEXT NOT NULL,
  sessao_id    TEXT NOT NULL,
  fila_json    TEXT NOT NULL,
  pausada_em   TEXT NOT NULL,
  PRIMARY KEY (perfil_id, unidade_id)
);
