-- Migration: 0003_seed_exercicios
-- Created: 2026-05-24
-- Seed data: áreas, módulos, unidades e exercícios táticos iniciais

-- ── ÁREAS ────────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO areas (id, nome, descricao, ordem) VALUES
  ('area-tatica',    'Tática',    'Combinações e golpes táticos',          1),
  ('area-estrategia','Estratégia','Conceitos posicionais e de planejamento',2),
  ('area-finais',    'Finais',    'Técnica em finais de jogo',              3),
  ('area-aberturas', 'Aberturas', 'Princípios e variantes de abertura',     4);

-- ── MÓDULOS ───────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO modulos (id, area_id, nome, descricao, ordem) VALUES
  ('mod-garfo',        'area-tatica',    'Garfo',             'Ataque simultâneo a duas peças',           1),
  ('mod-cravada',      'area-tatica',    'Cravada',           'Peça imobilizada que protege outra',       2),
  ('mod-espeto',       'area-tatica',    'Espeto',            'Ataque a peça valiosa forçando exposição', 3),
  ('mod-mate-basico',  'area-tatica',    'Xeque-mate Básico', 'Padrões de mate em 1 e 2 lances',         4),
  ('mod-centro',       'area-estrategia','Controle do Centro','Importância das casas centrais',           1),
  ('mod-finais-rei',   'area-finais',    'Rei e Peão',        'Finais elementares de rei e peão',         1),
  ('mod-abertura-e4',  'area-aberturas', '1.e4 — Abertura',   'Respostas a 1.e4',                        1);

-- ── UNIDADES ─────────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO unidades (id, modulo_id, nome, descricao, ordem) VALUES
  ('uni-garfo-cavalo',    'mod-garfo',       'Garfo de Cavalo',       'Cavalos atacando duas peças ao mesmo tempo', 1),
  ('uni-garfo-peao',      'mod-garfo',       'Garfo de Peão',         'Peão atacando duas peças ao mesmo tempo',    2),
  ('uni-cravada-absoluta','mod-cravada',     'Cravada Absoluta',      'Peça cravada ao rei',                        1),
  ('uni-cravada-relativa','mod-cravada',     'Cravada Relativa',      'Peça cravada a peça valiosa',                2),
  ('uni-espeto-basico',   'mod-espeto',      'Espeto Básico',         'Xeque forçando exposição de peça atrás',     1),
  ('uni-mate-1',          'mod-mate-basico', 'Mate em 1',             'Encontre o xeque-mate em um lance',          1),
  ('uni-mate-2',          'mod-mate-basico', 'Mate em 2',             'Encontre o xeque-mate em dois lances',       2),
  ('uni-oposicao',        'mod-finais-rei',  'Oposição',              'Rei contra rei — quem tem a oposição',       1);

-- ── PARTIDAS ─────────────────────────────────────────────────────────────────
-- Partidas reais que originam os exercícios
INSERT OR IGNORE INTO partidas (id, brancas, negras, elo_brancas, elo_negras, evento, ano, resultado, eco, pgn) VALUES
  ('game-opera',
   'Paul Morphy', 'Duke of Brunswick', NULL, NULL,
   'Opera Game', 1858, '1-0', 'C41',
   '[Event "Opera Game"][Site "Paris"][Date "1858.??.??"][White "Morphy, Paul"][Black "Duke of Brunswick"][Result "1-0"][ECO "C41"] 1.e4 e5 2.Nf3 d6 3.d4 Bg4 4.dxe5 Bxf3 5.Qxf3 dxe5 6.Bc4 Nf6 7.Qb3 Qe7 8.Nc3 c6 9.Bg5 b5 10.Nxb5 cxb5 11.Bxb5+ Nbd7 12.O-O-O Rd8 13.Rxd7 Rxd7 14.Rd1 Qe6 15.Bxd7+ Nxd7 16.Qb8+ Nxb8 17.Rd8# 1-0'),
  ('game-immortal',
   'Adolf Anderssen', 'Lionel Kieseritzky', NULL, NULL,
   'Immortal Game', 1851, '1-0', 'C33',
   '[Event "Casual Game"][Site "London"][Date "1851.06.21"][White "Anderssen, Adolf"][Black "Kieseritzky, Lionel"][Result "1-0"][ECO "C33"] 1.e4 e5 2.f4 exf4 3.Bc4 Qh4+ 4.Kf1 b5 5.Bxb5 Nf6 6.Nf3 Qh6 7.d3 Nh5 8.Nh4 Qg5 9.Nf5 c6 10.g4 Nf6 11.Rg1 cxb5 12.h4 Qg6 13.h5 Qg5 14.Qf3 Ng8 15.Bxf4 Qf6 16.Nc3 Bc5 17.Nd5 Qxb2 18.Bd6 Bxg1 19.e5 Qxa1+ 20.Ke2 Na6 21.Nxg7+ Kd8 22.Qf6+ Nxf6 23.Be7# 1-0'),
  ('game-evergreen',
   'Adolf Anderssen', 'Jean Dufresne', NULL, NULL,
   'Evergreen Game', 1852, '1-0', 'C52',
   '[Event "Casual Game"][Site "Berlin"][Date "1852.??.??"][White "Anderssen, Adolf"][Black "Dufresne, Jean"][Result "1-0"][ECO "C52"] 1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4 Bxb4 5.c3 Ba5 6.d4 exd4 7.O-O d3 8.Qb3 Qf6 9.e5 Qg6 10.Re1 Nge7 11.Ba3 b5 12.Qxb5 Rb8 13.Qa4 Bb6 14.Nbd2 Bb7 15.Ne4 Qf5 16.Bxd3 Qh5 17.Nf6+ gxf6 18.exf6 Rg8 19.Rad1 Qxf3 20.Rxe7+ Nxe7 21.Qxd7+ Kxd7 22.Bf5+ Ke8 23.Bd7+ Kf8 24.Bxe7# 1-0'),
  ('game-fried-liver',
   'Unknown', 'Unknown', NULL, NULL,
   'Fried Liver Attack Example', 1900, '1-0', 'C57',
   '[Event "Example"][Date "1900.??.??"][White "?"][Black "?"][Result "1-0"][ECO "C57"] 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5 6.Nxf7 Kxf7 7.Qf3+ Ke6 8.Nc3 Nb4 9.O-O c6 10.d4 Kd6 11.Nb5+ 1-0'),
  ('game-fork-study',
   'Study', 'Study', NULL, NULL,
   'Exercício de Garfo', 2000, '1-0', 'A00',
   NULL),
  ('game-pin-study',
   'Study', 'Study', NULL, NULL,
   'Exercício de Cravada', 2000, '1-0', 'A00',
   NULL);

-- ── EXERCÍCIOS ────────────────────────────────────────────────────────────────

-- Garfo de Cavalo (uni-garfo-cavalo)
INSERT OR IGNORE INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem) VALUES
  ('ex-garfo-cv-1', 'uni-garfo-cavalo', 'game-fork-study',
   'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
   '["Ng5"]',
   'r1bqkb1r/pppp1ppp/2n2n2/4p1N1/2B1P3/8/PPPP1PPP/RNBQK2R b KQkq - 5 4',
   'Brancas jogam. O cavalo pode fazer garfo atacando o rei adversário e a peça desprotegida.',
   1),
  ('ex-garfo-cv-2', 'uni-garfo-cavalo', 'game-fork-study',
   'r2qkb1r/ppp2ppp/2n2n2/3pp3/2B1P1b1/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 6',
   '["Nd5"]',
   'r2qkb1r/ppp2ppp/5n2/3Np3/2B1P1b1/3P1N2/PPP2PPP/R1BQK2R b KQkq - 1 6',
   'Brancas jogam. O cavalo ataca simultaneamente a dama e o cavalo adversários.',
   2),
  ('ex-garfo-cv-3', 'uni-garfo-cavalo', 'game-fork-study',
   '5rk1/pp3ppp/2p5/8/4n3/1P4P1/P4P1P/R3R1K1 b - - 0 22',
   '["Nf2"]',
   '5rk1/pp3ppp/2p5/8/8/1P4P1/P4nPP/R3R1K1 w - - 1 23',
   'Negras jogam. O cavalo faz garfo simultâneo no rei e na torre.',
   3),
  ('ex-garfo-cv-4', 'uni-garfo-cavalo', 'game-fork-study',
   'r1bqkbnr/pppp1ppp/2n5/8/2BpP3/5N2/PPP2PPP/RNBQK2R w KQkq - 0 5',
   '["Ng5"]',
   'r1bqkbnr/pppp1ppp/2n5/6N1/2BpP3/8/PPP2PPP/RNBQK2R b KQkq - 1 5',
   'Brancas jogam. Identifique o garfo de cavalo que ataca f7 simultaneamente.',
   4);

-- Garfo de Peão (uni-garfo-peao)
INSERT OR IGNORE INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem) VALUES
  ('ex-garfo-peao-1', 'uni-garfo-peao', 'game-fork-study',
   'r1bqkb1r/pppp1ppp/5n2/4n3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 4 4',
   '["d4"]',
   'r1bqkb1r/pppp1ppp/5n2/4n3/2BPP3/8/PPP2PPP/RNBQK1NR b KQkq d3 0 4',
   'Brancas jogam. O peão avança atacando dois cavalos adversários ao mesmo tempo.',
   1),
  ('ex-garfo-peao-2', 'uni-garfo-peao', 'game-fork-study',
   '2r1kb1r/pp3ppp/2n2n2/3pp3/3PP3/2N2N2/PPP2PPP/R1B1KB1R w KQkq - 0 8',
   '["d5"]',
   '2r1kb1r/pp3ppp/2n2n2/3Pp3/4P3/2N2N2/PPP2PPP/R1B1KB1R b KQkq - 0 8',
   'Brancas jogam. O peão avança com garfo duplo sobre as peças adversárias.',
   2);

-- Cravada Absoluta (uni-cravada-absoluta)
INSERT OR IGNORE INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem) VALUES
  ('ex-cravada-abs-1', 'uni-cravada-absoluta', 'game-pin-study',
   'r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 3 5',
   '["Bd2"]',
   'r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPPB1PPP/RN1QK2R b KQkq - 4 5',
   'Brancas jogam. Bloqueie a cravada sobre o rei com um lance que mantém vantagem.',
   1),
  ('ex-cravada-abs-2', 'uni-cravada-absoluta', 'game-pin-study',
   'rnbqk2r/ppp2ppp/3p1n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 2 5',
   '["O-O"]',
   'rnbqk2r/ppp2ppp/3p1n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQ1RK1 b kq - 3 5',
   'Brancas jogam. Qual o melhor lance para escapar da cravada no rei?',
   2),
  ('ex-cravada-abs-3', 'uni-cravada-absoluta', 'game-pin-study',
   'r1b1kb1r/ppppqppp/2n2n2/4p1B1/2B1P3/2N2N2/PPPP1PPP/R2QK2R w KQkq - 4 6',
   '["Bxf6"]',
   'r1b1kb1r/ppppqppp/2n2B2/4p3/2B1P3/2N2N2/PPPP1PPP/R2QK2R b KQkq - 0 6',
   'Brancas jogam. O bispo crava o cavalo que protege a dama. Qual o melhor lance?',
   3);

-- Cravada Relativa (uni-cravada-relativa)
INSERT OR IGNORE INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem) VALUES
  ('ex-cravada-rel-1', 'uni-cravada-relativa', 'game-pin-study',
   'r2q1rk1/ppp2ppp/2n2n2/3pp3/1bBPP1b1/2N2N2/PPP2PPP/R1BQ1RK1 w - - 0 9',
   '["Bxf6"]',
   'r2q1rk1/ppp2ppp/2n2B2/3pp3/1b1PP1b1/2N2N2/PPP2PPP/R1BQ1RK1 b - - 0 9',
   'Brancas jogam. Quebre a cravada capturando o cavalo que protege a dama adversária.',
   1);

-- Espeto Básico (uni-espeto-basico)
INSERT OR IGNORE INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem) VALUES
  ('ex-espeto-1', 'uni-espeto-basico', 'game-pin-study',
   '3r1rk1/ppp2ppp/2n5/3Rp3/8/2N5/PPP2PPP/2KR4 w - - 0 15',
   '["Rd8"]',
   '3R1rk1/ppp2ppp/2n5/4p3/8/2N5/PPP2PPP/2KR4 b - - 0 15',
   'Brancas jogam. A torre faz espeto: xeque no rei expondo a torre atrás.',
   1),
  ('ex-espeto-2', 'uni-espeto-basico', 'game-pin-study',
   '4r1k1/1pp2ppp/p7/3R4/8/1B6/PPP2PPP/6K1 w - - 0 20',
   '["Rd8"]',
   '3R2k1/1pp2ppp/p7/8/8/1B6/PPP2PPP/6K1 b - - 0 20',
   'Brancas jogam. A torre faz espeto no rei, ganhando a torre que ficará exposta.',
   2);

-- Mate em 1 (uni-mate-1)
INSERT OR IGNORE INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem) VALUES
  ('ex-mate1-opera', 'uni-mate-1', 'game-opera',
   '3Q1b1r/r4kpp/p4p2/1p6/8/8/PPP2PPP/2KR4 w - - 0 17',
   '["Rd8#"]',
   '3Q1b1r/r4kpp/p4p2/1p6/8/8/PPP2PPP/2KR4 w - - 0 17',
   'Posição da famosa Partida da Ópera (Morphy, 1858). Mate em 1 — qual é o lance?',
   1),
  ('ex-mate1-back-rank', 'uni-mate-1', 'game-fork-study',
   '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
   '["Ra8#"]',
   '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
   'Mate na última fileira. Brancas jogam — mate em 1.',
   2),
  ('ex-mate1-smothered-setup', 'uni-mate-1', 'game-fork-study',
   'r5k1/6pp/8/8/8/8/8/4R1K1 w - - 0 1',
   '["Re8#"]',
   'r5k1/6pp/8/8/8/8/8/4R1K1 w - - 0 1',
   'Mate na última fileira com torre. Brancas jogam.',
   3),
  ('ex-mate1-corridor', 'uni-mate-1', 'game-fork-study',
   '8/8/8/8/4k3/8/4K3/7R w - - 0 1',
   '["Rh4#"]',
   '8/8/8/8/4k2R/8/4K3/8 b - - 1 1',
   'Mate com torre no corredor. Brancas jogam — mate em 1.',
   4),
  ('ex-mate1-queen', 'uni-mate-1', 'game-fork-study',
   '8/8/8/8/5k2/8/5K2/7Q w - - 0 1',
   '["Qh4#"]',
   '8/8/8/8/5k1Q/8/5K2/8 b - - 1 1',
   'Mate com dama. Brancas jogam — mate em 1.',
   5);

-- Mate em 2 (uni-mate-2)
INSERT OR IGNORE INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem) VALUES
  ('ex-mate2-evergreen', 'uni-mate-2', 'game-evergreen',
   'r1b2k1r/p4Bpp/1p6/3p4/8/1B6/PPP2PPP/2KR4 w - - 0 24',
   '["Bd7+", "Kf8", "Be7#"]',
   'r1b2B1r/p5pp/1p6/3p4/8/8/PPP2PPP/2KR4 b - - 0 24',
   'Posição da Partida Sempre-Verde (Anderssen, 1852). Mate em 2 lances.',
   1),
  ('ex-mate2-ladder', 'uni-mate-2', 'game-fork-study',
   '8/8/8/8/8/3k4/1R6/3K4 w - - 0 1',
   '["Rb3+", "Kc2", "Rb2#"]',
   '8/8/8/8/8/8/1Rk5/3K4 b - - 0 2',
   'Mate com torre em escada. Brancas jogam — mate em 2.',
   2),
  ('ex-mate2-smothered', 'uni-mate-2', 'game-fork-study',
   '6rk/5Npp/8/8/8/8/8/6K1 w - - 0 1',
   '["Nh6+", "Kh8", "Nxg8#"]',
   '6Nk/6pp/8/8/8/8/8/6K1 b - - 0 2',
   'Mate sufocado com cavalo. Brancas jogam — mate em 2.',
   3),
  ('ex-mate2-back-rank', 'uni-mate-2', 'game-fork-study',
   'r5k1/5ppp/8/8/8/8/Q7/6K1 w - - 0 1',
   '["Qxa8+", "Rxa8", "Ra1#"]',
   'R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 2',
   'Sacrifício de dama para mate na última fileira. Brancas jogam.',
   4);

-- Oposição em Finais (uni-oposicao)
INSERT OR IGNORE INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem) VALUES
  ('ex-oposicao-1', 'uni-oposicao', NULL,
   '8/8/8/4k3/8/4K3/8/8 w - - 0 1',
   '["Kd3"]',
   '8/8/8/4k3/8/3K4/8/8 b - - 1 1',
   'Brancas jogam para tomar a oposição. Qual o lance correto?',
   1),
  ('ex-oposicao-2', 'uni-oposicao', NULL,
   '8/8/3k4/8/8/3K4/8/8 w - - 0 1',
   '["Kc3"]',
   '8/8/3k4/8/8/2K5/8/8 b - - 1 1',
   'Brancas jogam para impedir o avanço do rei adversário. Use a oposição.',
   2),
  ('ex-oposicao-3', 'uni-oposicao', NULL,
   '8/8/8/8/4k3/8/4P3/4K3 w - - 0 1',
   '["Kf2"]',
   '8/8/8/8/4k3/8/4PK2/8 b - - 1 1',
   'Final de rei e peão. Brancas jogam para promover o peão.',
   3);
