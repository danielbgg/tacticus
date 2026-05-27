#!/usr/bin/env node
/**
 * Processa a base de puzzles do Lichess e gera duas migrations SQL:
 *   - 0010_circles_v3.sql  : 10 Círculos de Treino (I–X), rating 400–2500+
 *   - 0011_tatica_tematica.sql : 17 módulos temáticos de tática, exclusivos dos círculos
 *
 * Download do CSV:
 *   https://database.lichess.org/#puzzles  →  lichess_db_puzzle.csv.zst
 *
 * Descompactar:
 *   macOS:  brew install zstd && zstd -d lichess_db_puzzle.csv.zst
 *   Linux:  sudo apt install zstd && zstd -d lichess_db_puzzle.csv.zst
 *
 * Uso (a partir da raiz do projeto):
 *   node scripts/lichess-to-sql.mjs <caminho-do-csv>
 *
 * Exemplo:
 *   node scripts/lichess-to-sql.mjs ~/Downloads/lichess_db_puzzle.csv
 *
 * Saída:
 *   src/db/migrations/0010_circles_v3.sql
 *   src/db/migrations/0011_tatica_tematica.sql
 */

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';

// ── Argumentos ────────────────────────────────────────────────────────────────

const CSV_PATH = process.argv[2];
if (!CSV_PATH) {
  console.error('Uso: node scripts/lichess-to-sql.mjs <caminho-do-csv>');
  process.exit(1);
}

// ── Configuração dos Círculos ─────────────────────────────────────────────────

const UNIDADES_POR_MODULO = 51;
const PUZZLES_POR_UNIDADE = 14;
const PUZZLES_POR_MODULO  = UNIDADES_POR_MODULO * PUZZLES_POR_UNIDADE; // 714
const COLETA_MULTIPLO     = 5; // coletar 5× o necessário antes de selecionar os melhores

const MODULOS = [
  {
    id: 1, nome: 'Círculos I — Iniciação',
    descricao: 'Mate em 1 e táticas simples de uma jogada',
    ratingMin: 400, ratingMax: 800, ordem: 1,
  },
  {
    id: 2, nome: 'Círculos II — Fundamentos',
    descricao: 'Mate em 2 e combinações de 1–2 lances',
    ratingMin: 750, ratingMax: 1050, ordem: 2,
  },
  {
    id: 3, nome: 'Círculos III — Padrões',
    descricao: 'Combinações de 2–3 lances com motivos mistos',
    ratingMin: 1000, ratingMax: 1300, ordem: 3,
  },
  {
    id: 4, nome: 'Círculos IV — Combinações',
    descricao: 'Combinações de 3–4 lances e sacrifícios',
    ratingMin: 1200, ratingMax: 1500, ordem: 4,
  },
  {
    id: 5, nome: 'Círculos V — Emergente',
    descricao: 'Táticas de nível torneio com múltiplos motivos',
    ratingMin: 1500, ratingMax: 1700, ordem: 5,
  },
  {
    id: 6, nome: 'Círculos VI — Competitivo',
    descricao: 'Combinações com sacrifícios e linhas forçadas',
    ratingMin: 1700, ratingMax: 1900, ordem: 6,
  },
  {
    id: 7, nome: 'Círculos VII — Avançado',
    descricao: 'Táticas de alto nível com cálculo profundo',
    ratingMin: 1900, ratingMax: 2100, ordem: 7,
  },
  {
    id: 8, nome: 'Círculos VIII — Expert',
    descricao: 'Posições complexas exigindo precisão e visão',
    ratingMin: 2100, ratingMax: 2300, ordem: 8,
  },
  {
    id: 9, nome: 'Círculos IX — Candidato',
    descricao: 'Táticas de nível candidato a mestre',
    ratingMin: 2300, ratingMax: 2500, ordem: 9,
  },
  {
    id: 10, nome: 'Círculos X — Grande Mestre',
    descricao: 'Posições de elite resolvidas por grandes mestres',
    ratingMin: 2500, ratingMax: 9999, ordem: 10,
  },
];

// ── Configuração dos Módulos Temáticos ───────────────────────────────────────
// Cada puzzle vai para exatamente UM tema (o de maior prioridade entre seus tags).
// Puzzles selecionados para os Círculos são excluídos dos temáticos.

const TEMAS = [
  { id: 'mate-1',       nome: 'Xeque-mate em 1',    descricao: 'Encontre o mate forçado em um único lance',                   tags: ['mateIn1'],                                                                                    ordem: 1  },
  { id: 'mate-2',       nome: 'Xeque-mate em 2',    descricao: 'Calcule a sequência exata para dar mate em dois lances',      tags: ['mateIn2'],                                                                                    ordem: 2  },
  { id: 'mate-3plus',   nome: 'Xeque-mate em 3+',   descricao: 'Sequências de mate em três ou mais lances',                  tags: ['mateIn3', 'mateIn4', 'mateIn5'],                                                             ordem: 3  },
  { id: 'back-rank',    nome: 'Mate na Última Fila', descricao: 'Explore a fraqueza da primeira ou oitava fila',              tags: ['backRankMate'],                                                                               ordem: 4  },
  { id: 'padroes-mate', nome: 'Padrões de Mate',    descricao: 'Padrões clássicos: Anastásia, Árabe, Afogado, Gancho e mais', tags: ['anastasiaMate', 'arabianMate', 'smotheredMate', 'hookMate', 'dovetailMate', 'bodenMate', 'doubleBishopMate', 'queenRookMate'], ordem: 5 },
  { id: 'fork',         nome: 'Garfo',              descricao: 'Ataque simultaneamente duas ou mais peças do adversário',     tags: ['fork'],                                                                                       ordem: 6  },
  { id: 'pin',          nome: 'Cravada',             descricao: 'Imobilize uma peça que protege algo mais valioso atrás dela', tags: ['pin'],                                                                                       ordem: 7  },
  { id: 'skewer',       nome: 'Espeto',              descricao: 'Force uma peça valiosa a mover-se, expondo outra atrás',     tags: ['skewer'],                                                                                     ordem: 8  },
  { id: 'hanging',      nome: 'Peça Pendurada',      descricao: 'Capture peças desprotegidas ou mal defendidas',              tags: ['hangingPiece'],                                                                               ordem: 9  },
  { id: 'discovered',   nome: 'Ataque Descoberto',   descricao: 'Mova uma peça revelando o ataque de outra por trás',        tags: ['discoveredAttack'],                                                                           ordem: 10 },
  { id: 'double-check', nome: 'Duplo Xeque',         descricao: 'Dê xeque com duas peças simultaneamente',                   tags: ['doubleCheck'],                                                                                ordem: 11 },
  { id: 'deflection',   nome: 'Desvio',              descricao: 'Force uma peça defensora a abandonar seu posto crítico',    tags: ['deflection'],                                                                                 ordem: 12 },
  { id: 'attraction',   nome: 'Atração',             descricao: 'Atraia o rei ou peça inimiga para uma casa desfavorável',   tags: ['attraction'],                                                                                 ordem: 13 },
  { id: 'interference', nome: 'Interferência',       descricao: 'Interrompa a coordenação entre peças adversárias',          tags: ['interference'],                                                                               ordem: 14 },
  { id: 'trapped',      nome: 'Peça Aprisionada',    descricao: 'Capture ou ganhe uma peça sem escape',                      tags: ['trappedPiece'],                                                                               ordem: 15 },
  { id: 'zugzwang',     nome: 'Zugzwang',            descricao: 'Qualquer movimento do adversário piora sua posição',        tags: ['zugzwang'],                                                                                   ordem: 16 },
  { id: 'f2f7',         nome: 'Ataque a f2/f7',     descricao: 'Explore as casas f2 e f7, pontos vulneráveis no início',    tags: ['attackingF2F7'],                                                                              ordem: 17 },
];

// Mapeamento tag → themeId (para exclusividade: cada puzzle vai a um tema)
const TAG_THEME_ID = {};
for (const tema of TEMAS) {
  for (const tag of tema.tags) {
    if (!TAG_THEME_ID[tag]) TAG_THEME_ID[tag] = tema.id;
  }
}

// Prioridade de tag para resolver qual tema um puzzle "pertence" (menor = maior prioridade)
const TAG_PRIORITY = {
  mateIn1: 0, mateIn2: 1, mateIn3: 2, mateIn4: 3, mateIn5: 4,
  backRankMate: 10, anastasiaMate: 10, arabianMate: 10, smotheredMate: 10,
  hookMate: 10, dovetailMate: 10, bodenMate: 10, doubleBishopMate: 10, queenRookMate: 10,
  hangingPiece: 20, fork: 30, pin: 30, skewer: 30, attackingF2F7: 35,
  discoveredAttack: 40, doubleCheck: 40,
  deflection: 50, attraction: 50, interference: 50, trappedPiece: 50, zugzwang: 60,
};

// Prioridade de tema para ordenação progressiva DENTRO de cada Círculo
const CIRCLE_THEME_PRIORITY = { ...TAG_PRIORITY };

// ── Filtros de qualidade ──────────────────────────────────────────────────────
// Reduza esses valores se módulos de rating alto ficarem com poucos puzzles.

const MIN_PLAYS      = 300;
const MAX_RD         = 80;
const MIN_POPULARITY = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

function parseUci(uci) {
  return {
    from: uci.slice(0, 2),
    to:   uci.slice(2, 4),
    ...(uci.length === 5 ? { promotion: uci[4] } : {}),
  };
}

function applyMove(fen, uci) {
  try {
    const chess = new Chess(fen);
    const r = chess.move(parseUci(uci));
    return r ? chess.fen() : null;
  } catch {
    return null;
  }
}

function validateSolution(fen, moves) {
  try {
    const chess = new Chess(fen);
    for (const uci of moves) {
      if (!chess.move(parseUci(uci))) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function circleThemePriority(themes) {
  if (!themes) return 99;
  const list = themes.trim().split(' ');
  let best = 99;
  for (const t of list) {
    const p = CIRCLE_THEME_PRIORITY[t];
    if (p !== undefined && p < best) best = p;
  }
  return best;
}

function modIndexForRating(rating) {
  for (let i = 0; i < MODULOS.length; i++) {
    if (rating >= MODULOS[i].ratingMin && rating < MODULOS[i].ratingMax) return i;
  }
  return -1;
}

function getBestThemeId(themes) {
  if (!themes) return null;
  const tags = themes.trim().split(' ');
  let bestPriority = 100;
  let bestThemeId = null;
  for (const tag of tags) {
    const p  = TAG_PRIORITY[tag];
    const tid = TAG_THEME_ID[tag];
    if (p !== undefined && tid && p < bestPriority) {
      bestPriority = p;
      bestThemeId  = tid;
    }
  }
  return bestThemeId;
}

// ── Leitura do CSV em streaming ───────────────────────────────────────────────
// Formato Lichess: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,...

const circleBuckets  = MODULOS.map(() => []);
const themeBuckets   = new Map(TEMAS.map(t => [t.id, []]));
const MAX_THEME_POOL = PUZZLES_POR_MODULO * COLETA_MULTIPLO; // 3570 por tema

let totalLines = 0;
let accepted   = 0;

console.log(`\n📂 Lendo: ${CSV_PATH}`);
console.log('   (lê o CSV completo para garantir cobertura de temas raros)\n');

async function readCSV() {
  const rl = createInterface({ input: createReadStream(CSV_PATH), crlfDelay: Infinity });
  let header = true;

  for await (const line of rl) {
    if (header) { header = false; continue; }
    totalLines++;

    if (totalLines % 500_000 === 0) {
      const circlePct = circleBuckets.map(b =>
        Math.min(100, Math.round((b.length / (PUZZLES_POR_MODULO * COLETA_MULTIPLO)) * 100))
      );
      const themeSizes = TEMAS.map(t => themeBuckets.get(t.id).length);
      const themeTotal = themeSizes.reduce((s, n) => s + n, 0);
      console.log(`  ${totalLines.toLocaleString()} linhas | aceitos: ${accepted.toLocaleString()}`);
      console.log(`  Círculos: [${circlePct.map(p => p + '%').join(', ')}]`);
      console.log(`  Temas: ${themeTotal.toLocaleString()} puzzles em ${themeSizes.filter(n => n > 0).length}/${TEMAS.length} temas\n`);
    }

    // Parsing por índice de vírgula
    // Colunas: PuzzleId, FEN, Moves, Rating, RatingDeviation, Popularity, NbPlays, Themes, GameUrl, ...
    const commas = [];
    for (let i = 0; i < line.length && commas.length < 8; i++) {
      if (line[i] === ',') commas.push(i);
    }
    if (commas.length < 7) continue;

    const puzzleId   = line.slice(0, commas[0]);
    const fen        = line.slice(commas[0] + 1, commas[1]);
    const movesStr   = line.slice(commas[1] + 1, commas[2]);
    const rating     = parseInt(line.slice(commas[2] + 1, commas[3]));
    const rd         = parseInt(line.slice(commas[3] + 1, commas[4]));
    const popularity = parseInt(line.slice(commas[4] + 1, commas[5]));
    const plays      = parseInt(line.slice(commas[5] + 1, commas[6]));
    const themes     = line.slice(commas[6] + 1, commas[7] ?? line.length).trim();

    if (isNaN(rating) || isNaN(rd) || isNaN(popularity) || isNaN(plays)) continue;

    // Filtros de qualidade
    if (rd > MAX_RD)               continue;
    if (popularity < MIN_POPULARITY) continue;
    if (plays < MIN_PLAYS)         continue;

    const moves = movesStr.split(' ');
    if (moves.length < 2) continue;

    // O primeiro lance é o setup do adversário; o FEN do puzzle é após esse lance
    const fenInicial = applyMove(fen, moves[0]);
    if (!fenInicial) continue;

    const solucao = moves.slice(1);
    if (!validateSolution(fenInicial, solucao)) continue;

    const puzzle = { id: puzzleId, fenInicial, solucao, rating, popularity, plays, themes };

    // ── Coleta para Círculos ──────────────────────────────────────────────────
    const mi = modIndexForRating(rating);
    if (mi !== -1 && circleBuckets[mi].length < PUZZLES_POR_MODULO * COLETA_MULTIPLO) {
      circleBuckets[mi].push(puzzle);
    }

    // ── Coleta para Temas (exclusiva entre temas, não com círculos ainda) ─────
    const themeId = getBestThemeId(themes);
    if (themeId) {
      const bucket = themeBuckets.get(themeId);
      if (bucket.length < MAX_THEME_POOL) {
        bucket.push(puzzle);
      }
    }

    accepted++;
  }
}

await readCSV();

// ── Seleção final dos Círculos ────────────────────────────────────────────────

console.log('🔍 Selecionando puzzles dos Círculos...\n');

const circlesFinal = MODULOS.map((mod, mi) => {
  const pool = circleBuckets[mi];

  if (pool.length < PUZZLES_POR_MODULO) {
    console.warn(`⚠  Círculo ${mod.id}: apenas ${pool.length} puzzles (precisa de ${PUZZLES_POR_MODULO}).`);
    console.warn(`   Tente reduzir MIN_PLAYS, MAX_RD ou MIN_POPULARITY no início do script.\n`);
  }

  // Seleciona os mais populares do pool
  pool.sort((a, b) => b.popularity - a.popularity || b.plays - a.plays);
  const chosen = pool.slice(0, PUZZLES_POR_MODULO);

  // Reordena: prioridade de tema e, dentro do mesmo tema, rating crescente
  chosen.sort((a, b) => {
    const pa = circleThemePriority(a.themes);
    const pb = circleThemePriority(b.themes);
    if (pa !== pb) return pa - pb;
    return a.rating - b.rating;
  });

  const minR = chosen[0]?.rating ?? 0;
  const maxR = chosen[chosen.length - 1]?.rating ?? 0;
  console.log(`  Círculo ${String(mod.id).padStart(2)}: ${chosen.length.toString().padStart(3)} puzzles | rating ${minR}–${maxR} | pool: ${pool.length}`);
  return chosen;
});

// IDs de todos os puzzles selecionados para círculos (para excluir dos temáticos)
const circleSelectedIds = new Set(circlesFinal.flatMap(arr => arr.map(p => p.id)));

console.log(`\n  Total círculos: ${circleSelectedIds.size.toLocaleString()} puzzles únicos selecionados\n`);

// ── Seleção final dos Temas ───────────────────────────────────────────────────

console.log('🎯 Selecionando puzzles Temáticos (excluindo círculos)...\n');

const temasFinal = TEMAS.map(tema => {
  const pool = themeBuckets.get(tema.id);

  // Remove puzzles já usados nos círculos
  const exclusive = pool.filter(p => !circleSelectedIds.has(p.id));

  // Ordena por rating crescente (dificuldade progressiva)
  exclusive.sort((a, b) => a.rating - b.rating);

  // Limita a PUZZLES_POR_MODULO (714 = 51 unidades × 14)
  const chosen = exclusive.slice(0, PUZZLES_POR_MODULO);

  const unidades = Math.ceil(chosen.length / PUZZLES_POR_UNIDADE);
  const minR = chosen[0]?.rating ?? 0;
  const maxR = chosen[chosen.length - 1]?.rating ?? 0;
  const ratingStr = chosen.length > 0 ? `rating ${minR}–${maxR}` : 'sem puzzles';
  console.log(`  ${tema.id.padEnd(15)}: ${String(chosen.length).padStart(3)} puzzles, ${unidades} unidades | ${ratingStr} | pool bruto: ${pool.length}`);
  return { tema, puzzles: chosen };
});

const totalTematicos = temasFinal.reduce((s, t) => s + t.puzzles.length, 0);
console.log(`\n  Total temáticos: ${totalTematicos.toLocaleString()} puzzles exclusivos\n`);

// ── Geração do SQL dos Círculos (0010_circles_v3.sql) ────────────────────────

console.log('📝 Gerando 0010_circles_v3.sql...\n');

const circlesLines = [];
circlesLines.push('-- Migration: 0010_circles_v3');
circlesLines.push('-- Gerado por: node scripts/lichess-to-sql.mjs');
circlesLines.push('-- Fonte: Lichess Open Database — https://database.lichess.org/#puzzles');
circlesLines.push('-- Licença dos dados: CC0 (domínio público)');
circlesLines.push('-- NÃO EDITE MANUALMENTE — regenere com o script se necessário');
circlesLines.push('');

// Área
circlesLines.push("INSERT OR IGNORE INTO areas (id, nome, descricao, ordem) VALUES");
circlesLines.push("  ('area-circulos', 'Círculos de Treino',");
circlesLines.push("   'Treino progressivo pelo método Chessimo Circles — progressão pura de dificuldade sem filtro de tema',");
circlesLines.push("   5);");
circlesLines.push('');

// Módulos
circlesLines.push('INSERT OR IGNORE INTO modulos (id, area_id, nome, descricao, ordem) VALUES');
circlesLines.push(MODULOS.map((m, i) => {
  const comma = i < MODULOS.length - 1 ? ',' : ';';
  return `  (${esc('circles-mod-' + m.id)}, 'area-circulos', ${esc(m.nome)}, ${esc(m.descricao)}, ${m.ordem})${comma}`;
}).join('\n'));
circlesLines.push('');

// Unidades e exercícios por módulo
for (let mi = 0; mi < MODULOS.length; mi++) {
  const mod     = MODULOS[mi];
  const puzzles = circlesFinal[mi];

  circlesLines.push(`-- ── Círculo ${mod.id}: ${mod.nome} ─────────────────────────────────────────────`);
  circlesLines.push('');

  const unitRows = [];
  for (let u = 1; u <= UNIDADES_POR_MODULO; u++) {
    const uid   = `circles-m${mod.id}-u${String(u).padStart(2, '0')}`;
    const comma = u < UNIDADES_POR_MODULO ? ',' : ';';
    unitRows.push(`  (${esc(uid)}, ${esc('circles-mod-' + mod.id)}, ${esc('Unidade ' + u)}, NULL, ${u})${comma}`);
  }
  circlesLines.push('INSERT OR IGNORE INTO unidades (id, modulo_id, nome, descricao, ordem) VALUES');
  circlesLines.push(unitRows.join('\n'));
  circlesLines.push('');

  for (let u = 0; u < UNIDADES_POR_MODULO; u++) {
    const uid   = `circles-m${mod.id}-u${String(u + 1).padStart(2, '0')}`;
    const slice = puzzles.slice(u * PUZZLES_POR_UNIDADE, (u + 1) * PUZZLES_POR_UNIDADE);
    if (slice.length === 0) continue;

    const rows = slice.map((p, i) => {
      const comma = i < slice.length - 1 ? ',' : ';';
      const desc  = `Lichess #${p.id} (${p.rating})`;
      const temas = p.themes ? esc(p.themes) : 'NULL';
      return `  (${esc('c-' + p.id)}, ${esc(uid)}, NULL, ${esc(p.fenInicial)}, ${esc(JSON.stringify(p.solucao))}, NULL, ${esc(desc)}, ${i + 1}, ${temas})${comma}`;
    });

    circlesLines.push('INSERT OR IGNORE INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem, temas) VALUES');
    circlesLines.push(rows.join('\n'));
  }
  circlesLines.push('');
}

const OUT_CIRCLES = 'src/db/migrations/0010_circles_v3.sql';
writeFileSync(OUT_CIRCLES, circlesLines.join('\n'), 'utf-8');

const totalCircles = circlesFinal.reduce((s, arr) => s + arr.length, 0);
console.log(`  ✅ ${OUT_CIRCLES}`);
console.log(`     ${totalCircles.toLocaleString()} exercícios (${MODULOS.length} círculos × ${UNIDADES_POR_MODULO} unidades × ${PUZZLES_POR_UNIDADE})`);
console.log('');

// ── Geração do SQL Temático (0011_tatica_tematica.sql) ────────────────────────

console.log('📝 Gerando 0011_tatica_tematica.sql...\n');

const tematicaLines = [];
tematicaLines.push('-- Migration: 0011_tatica_tematica');
tematicaLines.push('-- Gerado por: node scripts/lichess-to-sql.mjs');
tematicaLines.push('-- Fonte: Lichess Open Database — https://database.lichess.org/#puzzles');
tematicaLines.push('-- Licença dos dados: CC0 (domínio público)');
tematicaLines.push('-- Puzzles EXCLUSIVOS dos Círculos — sem sobreposição com 0010_circles_v3.sql');
tematicaLines.push('-- NÃO EDITE MANUALMENTE — regenere com o script se necessário');
tematicaLines.push('');

// area-tatica já existe (criada em 0003, preservada na limpeza 0009)
tematicaLines.push("INSERT OR IGNORE INTO areas (id, nome, descricao, ordem) VALUES");
tematicaLines.push("  ('area-tatica', 'Tática', 'Módulos temáticos de tática ordenados por dificuldade crescente', 4);");
tematicaLines.push('');

// Módulos temáticos
tematicaLines.push('INSERT OR IGNORE INTO modulos (id, area_id, nome, descricao, ordem) VALUES');
tematicaLines.push(TEMAS.map((t, i) => {
  const comma = i < TEMAS.length - 1 ? ',' : ';';
  return `  (${esc('mod-tatica-' + t.id)}, 'area-tatica', ${esc(t.nome)}, ${esc(t.descricao)}, ${t.ordem})${comma}`;
}).join('\n'));
tematicaLines.push('');

// Unidades e exercícios por tema
for (const { tema, puzzles } of temasFinal) {
  if (puzzles.length === 0) {
    tematicaLines.push(`-- ⚠ Tema ${tema.id}: sem puzzles exclusivos disponíveis`);
    tematicaLines.push('');
    continue;
  }

  const numUnidades = Math.ceil(puzzles.length / PUZZLES_POR_UNIDADE);
  const modId = `mod-tatica-${tema.id}`;

  tematicaLines.push(`-- ── Tema: ${tema.nome} (${puzzles.length} exercícios, ${numUnidades} unidades) ────────────────────`);
  tematicaLines.push('');

  const unitRows = [];
  for (let u = 1; u <= numUnidades; u++) {
    const uid   = `tt-${tema.id}-u${String(u).padStart(2, '0')}`;
    const comma = u < numUnidades ? ',' : ';';
    unitRows.push(`  (${esc(uid)}, ${esc(modId)}, ${esc('Unidade ' + u)}, NULL, ${u})${comma}`);
  }
  tematicaLines.push('INSERT OR IGNORE INTO unidades (id, modulo_id, nome, descricao, ordem) VALUES');
  tematicaLines.push(unitRows.join('\n'));
  tematicaLines.push('');

  for (let u = 0; u < numUnidades; u++) {
    const uid   = `tt-${tema.id}-u${String(u + 1).padStart(2, '0')}`;
    const slice = puzzles.slice(u * PUZZLES_POR_UNIDADE, (u + 1) * PUZZLES_POR_UNIDADE);
    if (slice.length === 0) continue;

    const rows = slice.map((p, i) => {
      const comma = i < slice.length - 1 ? ',' : ';';
      const desc  = `Lichess #${p.id} (${p.rating})`;
      const temas = p.themes ? esc(p.themes) : 'NULL';
      // Prefixo 'tt-' para evitar colisão com exercícios de Círculos ('c-')
      return `  (${esc('tt-' + p.id)}, ${esc(uid)}, NULL, ${esc(p.fenInicial)}, ${esc(JSON.stringify(p.solucao))}, NULL, ${esc(desc)}, ${i + 1}, ${temas})${comma}`;
    });

    tematicaLines.push('INSERT OR IGNORE INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem, temas) VALUES');
    tematicaLines.push(rows.join('\n'));
  }
  tematicaLines.push('');
}

const OUT_TEMATICA = 'src/db/migrations/0011_tatica_tematica.sql';
writeFileSync(OUT_TEMATICA, tematicaLines.join('\n'), 'utf-8');

console.log(`  ✅ ${OUT_TEMATICA}`);
console.log(`     ${totalTematicos.toLocaleString()} exercícios temáticos exclusivos`);
console.log('');

// ── Relatório final ───────────────────────────────────────────────────────────

const grandTotal = totalCircles + totalTematicos;
console.log('═══════════════════════════════════════════════════════════');
console.log(`  Total geral: ${grandTotal.toLocaleString()} exercícios`);
console.log(`    Círculos (I–X): ${totalCircles.toLocaleString()}`);
console.log(`    Temáticos:      ${totalTematicos.toLocaleString()}`);
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('Próximos passos:');
console.log('  1. Confirmar os arquivos gerados em src/db/migrations/');
console.log('  2. Adicionar migrations 10 e 11 em src/db/schema.ts');
console.log('  3. Rodar pnpm tauri dev — migrations aplicadas automaticamente');
