#!/usr/bin/env node
/**
 * Processa a base de puzzles do Lichess e gera migration SQL para os Círculos de Treino.
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
 *   src/db/migrations/0007_circles_v2.sql
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

// ── Configuração dos módulos ──────────────────────────────────────────────────

const UNIDADES_POR_MODULO = 51;
const PUZZLES_POR_UNIDADE = 14;
const PUZZLES_POR_MODULO  = UNIDADES_POR_MODULO * PUZZLES_POR_UNIDADE; // 714
const COLETA_MULTIPLO     = 5; // coletar 5× o necessário antes de selecionar

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
    id: 5, nome: 'Círculos V — Avançado',
    descricao: 'Táticas complexas com múltiplos motivos',
    ratingMin: 1450, ratingMax: 1800, ordem: 5,
  },
  {
    id: 6, nome: 'Círculos VI — Mestre',
    descricao: 'Posições de alto nível com linhas forçadas longas',
    ratingMin: 1750, ratingMax: 2600, ordem: 6,
  },
];

// ── Filtros de qualidade ──────────────────────────────────────────────────────
// Ajuste aqui se algum módulo tiver poucos puzzles no relatório final.

const MIN_PLAYS      = 300; // mínimo de partidas jogadas
const MAX_RD         = 80;  // desvio de rating máximo (quanto menor, mais confiável)
const MIN_POPULARITY = 50;  // popularidade mínima (-100 a 100)

// ── Prioridade de tema (para ordenação progressiva dentro de cada módulo) ─────
// Menor número = vem primeiro. Temas não listados recebem prioridade 99.
const THEME_PRIORITY = {
  mateIn1: 0,
  mateIn2: 1,
  mateIn3: 2,
  mateIn4: 3,
  mateIn5: 4,
  anastasiaMate: 10,
  arabianMate: 10,
  backRankMate: 10,
  bodenMate: 10,
  doubleBishopMate: 10,
  dovetailMate: 10,
  hookMate: 10,
  smotheredMate: 10,
  queenRookMate: 10,
  hangingPiece: 20,
  fork: 30,
  pin: 30,
  skewer: 30,
  attackingF2F7: 35,
  discoveredAttack: 40,
  doubleCheck: 40,
  deflection: 50,
  attraction: 50,
  interference: 50,
  trappedPiece: 50,
  zugzwang: 60,
};

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

// Aplica o primeiro lance UCI ao FEN para obter a posição do puzzle
function applyMove(fen, uci) {
  try {
    const chess = new Chess(fen);
    const r = chess.move(parseUci(uci));
    return r ? chess.fen() : null;
  } catch {
    return null;
  }
}

// Valida que todos os lances da solução são legais a partir do FEN
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

function themePriority(themes) {
  if (!themes) return 99;
  const list = themes.trim().split(' ');
  let best = 99;
  for (const t of list) {
    const p = THEME_PRIORITY[t];
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

// ── Leitura do CSV em streaming ───────────────────────────────────────────────
// Formato Lichess: PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,...

const buckets = MODULOS.map(() => []);
let totalLines = 0;
let accepted   = 0;

console.log(`\n📂 Lendo: ${CSV_PATH}\n`);

async function readCSV() {
  const rl = createInterface({ input: createReadStream(CSV_PATH), crlfDelay: Infinity });
  let header = true;

  for await (const line of rl) {
    if (header) { header = false; continue; }
    totalLines++;

    if (totalLines % 200_000 === 0) {
      const counts = buckets.map(b => b.length);
      const pct = counts.map(c => Math.min(100, Math.round((c / (PUZZLES_POR_MODULO * COLETA_MULTIPLO)) * 100)));
      console.log(`  ${totalLines.toLocaleString()} linhas | aceitos: ${accepted.toLocaleString()} | buckets: [${pct.map(p => p + '%').join(', ')}]`);
      if (counts.every((c, i) => c >= PUZZLES_POR_MODULO * COLETA_MULTIPLO)) {
        console.log('  → Todos os buckets cheios. Encerrando leitura.\n');
        break;
      }
    }

    // Parsing manual por índice de vírgula
    // Colunas: PuzzleId, FEN, Moves, Rating, RatingDeviation, Popularity, NbPlays, Themes, GameUrl, ...
    const commas = [];
    for (let i = 0; i < line.length && commas.length < 8; i++) {
      if (line[i] === ',') { commas.push(i); }
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
    if (rd > MAX_RD)              continue;
    if (popularity < MIN_POPULARITY) continue;
    if (plays < MIN_PLAYS)        continue;

    const mi = modIndexForRating(rating);
    if (mi === -1) continue;
    if (buckets[mi].length >= PUZZLES_POR_MODULO * COLETA_MULTIPLO) continue;

    const moves = movesStr.split(' ');
    if (moves.length < 2) continue; // precisa de pelo menos: lance-setup + 1 lance de solução

    // O primeiro lance é o "setup" do adversário; o FEN do puzzle é após esse lance
    const fenInicial = applyMove(fen, moves[0]);
    if (!fenInicial) continue;

    const solucao = moves.slice(1);
    if (!validateSolution(fenInicial, solucao)) continue;

    buckets[mi].push({ id: puzzleId, fenInicial, solucao, rating, popularity, plays, themes });
    accepted++;
  }
}

await readCSV();

// ── Seleção e ordenação final ─────────────────────────────────────────────────

console.log('🔍 Selecionando puzzles finais...\n');

const final = MODULOS.map((mod, mi) => {
  const pool = buckets[mi];

  if (pool.length < PUZZLES_POR_MODULO) {
    console.warn(`⚠  Módulo ${mod.id}: apenas ${pool.length} puzzles disponíveis (precisa de ${PUZZLES_POR_MODULO}).`);
    console.warn(`   Tente reduzir MIN_PLAYS, MAX_RD ou MIN_POPULARITY no início do script.`);
  }

  // 1. Pegar os mais populares do pool
  pool.sort((a, b) => b.popularity - a.popularity || b.plays - a.plays);
  const chosen = pool.slice(0, PUZZLES_POR_MODULO);

  // 2. Reordenar: prioridade de tema (mateIn1 antes de mateIn2 etc.) e, dentro do mesmo tema, rating crescente
  chosen.sort((a, b) => {
    const pa = themePriority(a.themes);
    const pb = themePriority(b.themes);
    if (pa !== pb) return pa - pb;
    return a.rating - b.rating;
  });

  const minR = chosen[0]?.rating ?? 0;
  const maxR = chosen[chosen.length - 1]?.rating ?? 0;
  console.log(`  Módulo ${mod.id}: ${chosen.length} puzzles | rating ${minR}–${maxR} | pool: ${pool.length}`);
  return chosen;
});

// ── Geração do SQL ────────────────────────────────────────────────────────────

console.log('\n📝 Gerando SQL...\n');

const lines = [];

lines.push('-- Migration: 0007_circles_v2');
lines.push('-- Gerado por: node scripts/lichess-to-sql.mjs');
lines.push('-- Fonte: Lichess Open Database — https://database.lichess.org/#puzzles');
lines.push('-- Licença dos dados: CC0 (domínio público)');
lines.push('-- NÃO EDITE MANUALMENTE — regenere com o script se necessário');
lines.push('');

// Adiciona coluna temas (ignorado silenciosamente se já existir via trigger de migração sequencial)
lines.push('ALTER TABLE exercicios ADD COLUMN temas TEXT;');
lines.push('');

// Remove dados antigos dos Círculos para reinserir com temas
lines.push("DELETE FROM exercicios WHERE id LIKE 'c-%';");
lines.push("DELETE FROM unidades WHERE id LIKE 'circles-m%-u%';");
lines.push("DELETE FROM modulos WHERE id LIKE 'circles-mod-%';");
lines.push("DELETE FROM areas WHERE id = 'area-circulos';");
lines.push('');

// Área
lines.push("INSERT OR IGNORE INTO areas (id, nome, descricao, ordem) VALUES");
lines.push("  ('area-circulos', 'Círculos de Treino',");
lines.push("   'Treino progressivo pelo método Chessimo Circles — progressão pura de dificuldade sem filtro de tema',");
lines.push("   5);");
lines.push('');

// Módulos
lines.push('INSERT OR IGNORE INTO modulos (id, area_id, nome, descricao, ordem) VALUES');
lines.push(MODULOS.map((m, i) => {
  const comma = i < MODULOS.length - 1 ? ',' : ';';
  return `  (${esc('circles-mod-' + m.id)}, 'area-circulos', ${esc(m.nome)}, ${esc(m.descricao)}, ${m.ordem})${comma}`;
}).join('\n'));
lines.push('');

// Por módulo: unidades + exercícios
for (let mi = 0; mi < MODULOS.length; mi++) {
  const mod     = MODULOS[mi];
  const puzzles = final[mi];

  lines.push(`-- ── Módulo ${mod.id}: ${mod.nome} ─────────────────────────────────────────────`);
  lines.push('');

  // Unidades
  const unitRows = [];
  for (let u = 1; u <= UNIDADES_POR_MODULO; u++) {
    const uid   = `circles-m${mod.id}-u${String(u).padStart(2, '0')}`;
    const comma = u < UNIDADES_POR_MODULO ? ',' : ';';
    unitRows.push(`  (${esc(uid)}, ${esc('circles-mod-' + mod.id)}, ${esc('Unidade ' + u)}, NULL, ${u})${comma}`);
  }
  lines.push(`INSERT OR IGNORE INTO unidades (id, modulo_id, nome, descricao, ordem) VALUES`);
  lines.push(unitRows.join('\n'));
  lines.push('');

  // Exercícios — um INSERT por unidade para manter o SQL legível
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

    lines.push(`INSERT OR IGNORE INTO exercicios (id, unidade_id, partida_id, fen_inicial, lances_solucao, fen_final, descricao, ordem, temas) VALUES`);
    lines.push(rows.join('\n'));
  }
  lines.push('');
}

const OUT = 'src/db/migrations/0007_circles_v2.sql';
writeFileSync(OUT, lines.join('\n'), 'utf-8');

const total = final.reduce((s, arr) => s + arr.length, 0);

console.log(`✅ Arquivo gerado: ${OUT}`);
console.log(`   Exercícios: ${total.toLocaleString()} (${MODULOS.length} módulos × ${UNIDADES_POR_MODULO} unidades × ${PUZZLES_POR_UNIDADE} puzzles)`);
console.log('');
console.log('Próximos passos:');
console.log('  1. Adicionar migration 7 em src/db/schema.ts');
console.log('  2. Rodar pnpm tauri dev — a migration é aplicada automaticamente');
