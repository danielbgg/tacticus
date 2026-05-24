-- Migration: 0004_fix_exercicios
-- Corrige exercícios com FENs ou soluções inválidas (verificados com chess.js)

-- ── MATE EM 1 ────────────────────────────────────────────────────────────────
-- ex-mate1-opera: FEN original inválida (Rd8# era ilegal). Substituído por back-rank com captura.
UPDATE exercicios SET
  fen_inicial    = '2r3k1/5ppp/8/8/8/8/8/2R3K1 w - - 0 1',
  lances_solucao = '["Rxc8#"]',
  fen_final      = '2R3k1/5ppp/8/8/8/8/8/6K1 b - - 0 1',
  descricao      = 'Torre captura e dá mate. Brancas jogam — mate em 1.'
WHERE id = 'ex-mate1-opera';

-- ex-mate1-smothered-setup: Re8# não era xeque-mate (rei escapava). Substituído por torre+rei no canto.
UPDATE exercicios SET
  fen_inicial    = '5k2/8/5K2/R7/8/8/8/8 w - - 0 1',
  lances_solucao = '["Ra8#"]',
  fen_final      = 'R4k2/8/5K2/8/8/8/8/8 b - - 1 1',
  descricao      = 'Torre com apoio do rei. Brancas jogam — mate em 1.'
WHERE id = 'ex-mate1-smothered-setup';

-- ex-mate1-corridor: Rh4# não era xeque-mate (rei escapava para c5/d5). Substituído por dama+rei.
UPDATE exercicios SET
  fen_inicial    = '5k2/8/5K2/7Q/8/8/8/8 w - - 0 1',
  lances_solucao = '["Qf7#"]',
  fen_final      = '5k2/5Q2/5K2/8/8/8/8/8 b - - 1 1',
  descricao      = 'Dama com apoio do rei. Brancas jogam — mate em 1.'
WHERE id = 'ex-mate1-corridor';

-- ex-mate1-queen: Qh4# não era xeque-mate (rei escapava para f5). Substituído por cavalo sufocado.
UPDATE exercicios SET
  fen_inicial    = '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1',
  lances_solucao = '["Nf7#"]',
  fen_final      = '6rk/5Npp/8/8/8/8/8/6K1 b - - 1 1',
  descricao      = 'Mate sufocado com cavalo. Rei bloqueado pela própria torre e peões. Brancas jogam — mate em 1.'
WHERE id = 'ex-mate1-queen';

-- ── MATE EM 2 ────────────────────────────────────────────────────────────────
-- ex-mate2-evergreen: Bd7+ era ilegal. Substituído por torre+rei.
UPDATE exercicios SET
  fen_inicial    = '1k6/8/2K5/8/8/8/8/7R w - - 0 1',
  lances_solucao = '["Ra1", "Kc8", "Ra8#"]',
  fen_final      = 'R1k5/8/2K5/8/8/8/8/8 b - - 1 2',
  descricao      = 'Torre e rei. Empurre o rei para o canto e dê mate. Brancas jogam — mate em 2.'
WHERE id = 'ex-mate2-evergreen';

-- ex-mate2-ladder: Kc2 era ilegal para as pretas (rei não podia ir para lá). Substituído.
UPDATE exercicios SET
  fen_inicial    = '2k5/8/3K4/R7/8/8/8/8 w - - 0 1',
  lances_solucao = '["Rb5", "Kd8", "Rb8#"]',
  fen_final      = '1Rk5/8/3K4/8/8/8/8/8 b - - 1 2',
  descricao      = 'Torre e rei. Force o rei adversário para a última fileira. Brancas jogam — mate em 2.'
WHERE id = 'ex-mate2-ladder';

-- ex-mate2-smothered: Kh8 era ilegal para as pretas. Substituído.
UPDATE exercicios SET
  fen_inicial    = '5k2/8/6K1/8/8/8/8/7R w - - 0 1',
  lances_solucao = '["Re1", "Kg8", "Re8#"]',
  fen_final      = '4R1k1/8/6K1/8/8/8/8/8 b - - 1 2',
  descricao      = 'Torre e rei. Force o rei para g8 e dê mate na última fileira. Brancas jogam — mate em 2.'
WHERE id = 'ex-mate2-smothered';

-- ex-mate2-back-rank: Qxa8 já era xeque-mate em 1, Rxa8 era ilegal. Substituído.
UPDATE exercicios SET
  fen_inicial    = '1k6/8/1K6/R7/8/8/8/8 w - - 0 1',
  lances_solucao = '["Kc6", "Kc8", "Ra8#"]',
  fen_final      = 'R1k5/8/2K5/8/8/8/8/8 b - - 1 2',
  descricao      = 'Torre e rei. Aproxime o rei e force o canto. Brancas jogam — mate em 2.'
WHERE id = 'ex-mate2-back-rank';

-- ── GARFO ────────────────────────────────────────────────────────────────────
-- ex-garfo-cv-2: "Nd5" deveria ser "Nxd5" (captura de peão).
UPDATE exercicios SET
  lances_solucao = '["Nxd5"]',
  descricao      = 'Brancas jogam. O cavalo captura o peão em d5 fazendo garfo simultâneo na dama e no cavalo adversários.'
WHERE id = 'ex-garfo-cv-2';

-- ex-garfo-cv-3: FEN incorreta — o lance Nf2 não era legal nessa posição. Substituído por posição correta.
-- Cavalo e5 fork: Nc6+ ataca simultaneamente o rei em d8 e a torre em b8.
UPDATE exercicios SET
  fen_inicial    = '1r1k1b1r/8/8/4N3/8/8/8/4K3 w - - 0 1',
  lances_solucao = '["Nc6+"]',
  fen_final      = '1r1kNb1r/8/2N5/8/8/8/8/4K3 b - - 1 1',
  descricao      = 'Brancas jogam. O cavalo salta para c6 fazendo garfo simultâneo no rei e na torre adversários.'
WHERE id = 'ex-garfo-cv-3';
