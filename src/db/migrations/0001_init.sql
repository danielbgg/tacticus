-- Migration: 0001_init
-- Created: 2026-05-23

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS perfis (
  id                  TEXT PRIMARY KEY,
  nome                TEXT NOT NULL UNIQUE,
  avatar              TEXT NOT NULL,
  nivel               TEXT NOT NULL CHECK(nivel IN ('iniciante','intermediario','avancado','mestre')),
  acertos_para_dominar INTEGER NOT NULL DEFAULT 5 CHECK(acertos_para_dominar BETWEEN 3 AND 10),
  criado_em           TEXT NOT NULL,
  ultimo_acesso       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS configuracoes_perfil (
  perfil_id        TEXT PRIMARY KEY REFERENCES perfis(id) ON DELETE CASCADE,
  tema             TEXT NOT NULL DEFAULT 'escuro'
                   CHECK(tema IN ('claro','escuro','madeira')),
  estilo_tabuleiro TEXT NOT NULL DEFAULT 'classico'
                   CHECK(estilo_tabuleiro IN ('classico','neo','madeira','marmore','azul','verde')),
  conjunto_pecas   TEXT NOT NULL DEFAULT 'cburnett'
                   CHECK(conjunto_pecas IN ('cburnett','merida','alpha','pirouetti','fantasy')),
  animacao_lances  TEXT NOT NULL DEFAULT 'normal'
                   CHECK(animacao_lances IN ('lenta','normal','rapida','desligada')),
  som_habilitado   INTEGER NOT NULL DEFAULT 1,
  modo_daltonico   INTEGER NOT NULL DEFAULT 0,
  idioma           TEXT NOT NULL DEFAULT 'pt-BR'
                   CHECK(idioma IN ('pt-BR','en','es'))
);

CREATE TABLE IF NOT EXISTS areas (
  id       TEXT PRIMARY KEY,
  nome     TEXT NOT NULL,
  descricao TEXT,
  ordem    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS modulos (
  id       TEXT PRIMARY KEY,
  area_id  TEXT NOT NULL REFERENCES areas(id),
  nome     TEXT NOT NULL,
  descricao TEXT,
  ordem    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS unidades (
  id        TEXT PRIMARY KEY,
  modulo_id TEXT NOT NULL REFERENCES modulos(id),
  nome      TEXT NOT NULL,
  descricao TEXT,
  ordem     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS partidas (
  id          TEXT PRIMARY KEY,
  brancas     TEXT,
  negras      TEXT,
  elo_brancas INTEGER,
  elo_negras  INTEGER,
  evento      TEXT,
  ano         INTEGER,
  resultado   TEXT CHECK(resultado IN ('1-0','0-1','1/2-1/2','*')),
  eco         TEXT,
  pgn         TEXT
);

CREATE INDEX IF NOT EXISTS idx_partidas_ano     ON partidas(ano);
CREATE INDEX IF NOT EXISTS idx_partidas_eco     ON partidas(eco);
CREATE INDEX IF NOT EXISTS idx_partidas_brancas ON partidas(brancas);

CREATE TABLE IF NOT EXISTS exercicios (
  id             TEXT PRIMARY KEY,
  unidade_id     TEXT NOT NULL REFERENCES unidades(id),
  partida_id     TEXT REFERENCES partidas(id),
  fen_inicial    TEXT NOT NULL,
  lances_solucao TEXT NOT NULL DEFAULT '[]',
  fen_final      TEXT,
  descricao      TEXT,
  ordem          INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exercicios_unidade ON exercicios(unidade_id);
CREATE INDEX IF NOT EXISTS idx_exercicios_partida ON exercicios(partida_id);

CREATE TABLE IF NOT EXISTS progresso_exercicio (
  perfil_id            TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  exercicio_id         TEXT NOT NULL REFERENCES exercicios(id),
  status               TEXT NOT NULL DEFAULT 'nao_visto'
                       CHECK(status IN ('nao_visto','em_progresso','dominado')),
  acertos_consecutivos INTEGER NOT NULL DEFAULT 0,
  total_acertos        INTEGER NOT NULL DEFAULT 0,
  total_tentativas     INTEGER NOT NULL DEFAULT 0,
  fator_facilidade     REAL NOT NULL DEFAULT 2.5,
  intervalo_dias       INTEGER NOT NULL DEFAULT 0,
  proxima_revisao      TEXT,
  ultima_tentativa     TEXT,
  PRIMARY KEY (perfil_id, exercicio_id)
);

CREATE INDEX IF NOT EXISTS idx_progresso_perfil_status  ON progresso_exercicio(perfil_id, status);
CREATE INDEX IF NOT EXISTS idx_progresso_proxima_revisao ON progresso_exercicio(perfil_id, proxima_revisao);

CREATE TABLE IF NOT EXISTS sessoes (
  id               TEXT PRIMARY KEY,
  perfil_id        TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  inicio           TEXT NOT NULL,
  fim              TEXT,
  total_tentativas INTEGER NOT NULL DEFAULT 0,
  total_acertos    INTEGER NOT NULL DEFAULT 0,
  modo             TEXT NOT NULL CHECK(modo IN ('treino','revisao','livre'))
);

CREATE INDEX IF NOT EXISTS idx_sessoes_perfil      ON sessoes(perfil_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_perfil_data ON sessoes(perfil_id, inicio);

CREATE TABLE IF NOT EXISTS tentativas (
  id                TEXT PRIMARY KEY,
  sessao_id         TEXT NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
  perfil_id         TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  exercicio_id      TEXT NOT NULL REFERENCES exercicios(id),
  timestamp         TEXT NOT NULL,
  acertou           INTEGER NOT NULL,
  tempo_resposta_ms INTEGER NOT NULL,
  dicas_usadas      INTEGER NOT NULL DEFAULT 0 CHECK(dicas_usadas BETWEEN 0 AND 3)
);

CREATE INDEX IF NOT EXISTS idx_tentativas_perfil    ON tentativas(perfil_id);
CREATE INDEX IF NOT EXISTS idx_tentativas_exercicio ON tentativas(exercicio_id);
CREATE INDEX IF NOT EXISTS idx_tentativas_timestamp ON tentativas(perfil_id, timestamp);
