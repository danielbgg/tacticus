ALTER TABLE perfis ADD COLUMN elo_tatico INTEGER NOT NULL DEFAULT 1200;
ALTER TABLE configuracoes_perfil ADD COLUMN meta_diaria INTEGER NOT NULL DEFAULT 0;
ALTER TABLE configuracoes_perfil ADD COLUMN modo_cronometrado INTEGER NOT NULL DEFAULT 0;
ALTER TABLE configuracoes_perfil ADD COLUMN tempo_cronometro_s INTEGER NOT NULL DEFAULT 60;
ALTER TABLE progresso_exercicio ADD COLUMN favoritado INTEGER NOT NULL DEFAULT 0;
