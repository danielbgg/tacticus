-- Migration: 0002_add_conquistas
-- Created: 2026-05-23
-- Rollback: DROP TABLE conquistas_perfil; DROP TABLE conquistas;

CREATE TABLE IF NOT EXISTS conquistas (
  id        TEXT PRIMARY KEY,
  nome      TEXT NOT NULL,
  descricao TEXT NOT NULL,
  icone     TEXT NOT NULL,
  criterio  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conquistas_perfil (
  perfil_id       TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  conquista_id    TEXT NOT NULL REFERENCES conquistas(id),
  desbloqueado_em TEXT NOT NULL,
  PRIMARY KEY (perfil_id, conquista_id)
);

INSERT OR IGNORE INTO conquistas (id, nome, descricao, icone, criterio) VALUES
  ('c001', 'Primeiro Passo',      'Complete sua primeira sessão de treinamento', '🎯', '{"tipo":"sessoes","valor":1}'),
  ('c002', 'Semana Dedicada',     '7 dias consecutivos de treinamento',           '🔥', '{"tipo":"streak","valor":7}'),
  ('c003', 'Centenário Tático',   '100 exercícios de tática dominados',           '♟',  '{"tipo":"tatica_dominados","valor":100}'),
  ('c004', 'Mestre dos Finais',   '50 exercícios de finais dominados',            '♔',  '{"tipo":"finais_dominados","valor":50}'),
  ('c005', 'Estrategista',        '50 exercícios de estratégia dominados',        '⚔',  '{"tipo":"estrategia_dominados","valor":50}'),
  ('c006', 'Relâmpago',           'Resolva um exercício em menos de 5 segundos',  '⚡', '{"tipo":"tempo_rapido","valor":5000}'),
  ('c007', 'Maratonista',         '30 dias consecutivos de treinamento',          '🏅', '{"tipo":"streak","valor":30}'),
  ('c008', 'Mil Exercícios',      '1000 tentativas registradas',                  '💎', '{"tipo":"tentativas","valor":1000}');
