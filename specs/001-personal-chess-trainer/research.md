# Research: Personal Chess Trainer

**Date**: 2026-05-23  
**Phase**: 0 — Decisões técnicas com rationale

---

## 1. Shell Desktop: Tauri 2

**Decision**: Tauri 2 como wrapper desktop  
**Rationale**: Bundle final ~5MB vs ~150MB do Electron. Runtime em Rust fornece isolamento de segurança real via sistema de capabilities. SQLite nativo via `tauri-plugin-sql` sem overhead de processo filho. suporte a macOS, Windows e Linux a partir de um único codebase.  
**Alternatives considered**:
- Electron: descartado pelo tamanho do bundle e consumo de memória
- Neutralino: ecossistema menor, menos plugins maduros
- PWA: impossível acessar sistema de arquivos local com as permissões necessárias

---

## 2. Banco de Dados: SQLite via tauri-plugin-sql

**Decision**: SQLite com WAL mode, migrations versionadas, queries tipadas em TypeScript  
**Rationale**: Perfeito para dados locais de um único usuário. WAL mode garante leituras não-bloqueantes durante writes. 500k+ registros de tentativas não apresentam problema de performance com índices corretos. Sem necessidade de servidor. Export trivial (o próprio arquivo `.db`).  
**Alternatives considered**:
- IndexedDB (via Tauri): API assíncrona mais complexa, sem suporte a SQL declarativo, difícil de inspecionar
- LevelDB/RocksDB: sem suporte a queries relacionais — joins seriam feitos em memória
- Dexie.js: mesma limitação do IndexedDB

**Decisões de configuração**:
- `PRAGMA journal_mode = WAL`
- `PRAGMA foreign_keys = ON`
- `PRAGMA synchronous = NORMAL` (performance vs. durabilidade — aceitável para dados de treinamento)
- Migrations sequenciais: `0001_init.sql`, `0002_...` — aplicadas na inicialização do app

---

## 3. Algoritmo de Revisão Espaçada: SM-2

**Decision**: Implementação própria do SM-2 com ajuste por tempo de resposta  
**Rationale**: SM-2 é simples, comprovado (base do Anki) e suficiente para o caso de uso. Implementação própria de ~80 linhas evita dependência de biblioteca. O ajuste por tempo de resposta é uma extensão natural: resposta rápida aumenta mais o intervalo; resposta lenta aumenta menos — mesmo que correta.  
**Alternatives considered**:
- FSRS (Free Spaced Repetition Scheduler): mais preciso mas significativamente mais complexo; pode ser adotado em v2
- Leitner Box: muito simples, sem ajuste por facilidade
- SuperMemo SM-17+: proprietário e excessivamente complexo para este caso

**Parâmetros SM-2 adotados**:
```
fator_facilidade_inicial = 2.5
fator_facilidade_min = 1.3
incremento_acerto = +0.1
decremento_erro = -0.2
penalidade_dica_nivel1 = -0.05 (no fator de facilidade)
penalidade_dica_nivel2 = -0.10
penalidade_dica_nivel3 = conta como erro

intervalos_base = [1, 3, 7, 14, 30, 90] (dias)
```

---

## 4. Estado Global: Zustand 5

**Decision**: Zustand 5 com stores segmentadas por domínio  
**Rationale**: API mínima, sem boilerplate, sem Provider wrapper, suporte nativo a slices, serialização simples para persistência. TanStack Query 5 gerencia cache de dados do banco (queries assíncronas); Zustand gerencia estado de UI e sessão em curso.  
**Alternatives considered**:
- Redux Toolkit: excesso de abstração para este escopo
- Jotai: ótimo mas modelo atômico é menos natural para estado de sessão com invariantes complexos
- Context API: re-renders globais sem memoização cuidadosa

**Separação de responsabilidades**:
- `usePerfilStore`: perfil ativo, configurações visuais
- `useExercicioStore`: exercício atual, estado do tabuleiro, dicas
- `useSessaoStore`: fila da sessão, acertos/erros, XP
- TanStack Query: dados do banco (exercícios, histórico, estatísticas)

---

## 5. Roteamento: TanStack Router

**Decision**: TanStack Router com file-based routing  
**Rationale**: Tipagem end-to-end (parâmetros de rota tipados), suporte a loaders para pré-carregar dados antes de renderizar a tela, integração nativa com TanStack Query. Elimina a classe de erros de "parâmetro de rota como string genérica".  
**Alternatives considered**:
- React Router v7: menos type-safe, API de loaders mais verbosa
- Wouter: minimalista mas sem loaders e sem tipagem forte

---

## 6. Componentes de Xadrez: react-chessboard + chess.js

**Decision**: `react-chessboard` para renderização + `chess.js` para lógica de regras  
**Rationale**: `react-chessboard` é a biblioteca React mais mantida para tabuleiro interativo, com suporte a drag-and-drop, setas, highlights e customização de peças. `chess.js` valida lances, gera FEN/PGN e detecta xeque-mate — separação clara entre UI e lógica.  
**Alternatives considered**:
- Chessground (Lichess): mais performático mas sem wrapper React oficial; requer integração manual
- cm-chessboard: menos customizável visualmente

**Wrapper próprio**: `src/shared/components/Tabuleiro/` envolve `react-chessboard` com design tokens do projeto (estilos de tabuleiro, conjuntos de peças, modo daltônico).

---

## 7. Motor de Xadrez: Stockfish 16 WASM

**Decision**: Stockfish 16 em Web Worker dedicado, carregado sob demanda  
**Rationale**: O motor nunca bloqueia a thread principal. É carregado apenas quando o usuário solicita análise (após resolver um exercício) — nunca durante o treinamento ativo. O WASM é hospedado localmente no bundle, sem dependência de rede.  
**Alternatives considered**:
- Stockfish via binário nativo (Tauri shell): requer permissão de processo filho, mais complexo de empacotar multiplataforma
- Lc0 (neural network): tamanho de download proibitivo para app desktop
- Análise via API externa: viola o requisito de funcionamento offline

**Protocolo**: UCI sobre `postMessage` — wrapper TypeScript tipado em `src/shared/workers/stockfish.worker.ts`

---

## 8. Animações: Framer Motion 11

**Decision**: Framer Motion 11 para animações de UI; CSS transitions para micro-animações do tabuleiro  
**Rationale**: Framer Motion oferece API declarativa para animações de entrada/saída, transições de rota e gestos. Micro-animações do tabuleiro (shake no erro, seta no acerto) são CSS para evitar overhead do JS por frame. `prefers-reduced-motion` é tratado via hook `useReducedMotion()` do Framer.  
**Alternatives considered**:
- React Spring: API mais complexa para animações de layout
- CSS puro: insuficiente para animações de rota e gestos complexos

---

## 9. Parser de PGN: implementação própria

**Decision**: Parser PGN próprio em `src/shared/lib/pgn-parser.ts`  
**Rationale**: As bibliotecas disponíveis (`chess.js` parseia PGN mas não extrai posições-chave com anotações; `pgn-reader` é desatualizada). O parser do projeto precisa de comportamento específico: identificar posições táticas candidatas, extrair metadados de headers e preservar comentários por lance. ~200 linhas são suficientes.  
**Alternatives considered**:
- `@mliebelt/pgn-parser`: parseia bem mas não tem lógica de extração de posições-chave; seria necessário o mesmo trabalho de pós-processamento
- `chess.js` PGN load: sem acesso a comentários intermediários por lance

---

## 10. i18n: react-i18next

**Decision**: react-i18next com namespaces por feature  
**Rationale**: Biblioteca mais madura do ecossistema React para i18n. Suporte a pluralização, interpolação, lazy loading de locales e TypeScript com geração de tipos a partir dos arquivos de tradução.  
**Idiomas v1**: `pt-BR` (padrão), `en`, `es`  
**Namespace por feature**: `perfil`, `exercicio`, `sessao`, `estatisticas`, `banco`, `comum`

---

## 11. Testes: Vitest 2 + Testing Library + Playwright

**Decision**: Vitest para unit/integração, Playwright para E2E  
**Rationale**: Vitest é nativo para projetos Vite — zero config, mesmo formato de módulo, execução paralela. Testing Library força testar comportamento visível ao usuário (não implementação). Playwright cobre os 5 fluxos críticos com suporte a múltiplas plataformas.  

**SQLite em memória nos testes**:
```typescript
// setup de teste
const db = await Database.load("sqlite::memory:");
await runMigrations(db);
```

Sem mocks de banco — os testes de integração usam banco real em memória, garantindo que queries, índices e migrations estejam corretos.

---

## 12. Linting e Qualidade: ESLint 9 flat config + Lefthook

**Decision**: ESLint 9 flat config + Prettier 3 + Lefthook 1.6  
**Rationale**: ESLint 9 com flat config elimina complexidade de `.eslintrc` aninhados. Lefthook é mais rápido que husky (execução paralela de hooks). Pre-commit roda lint-staged + `tsc --noEmit`; pre-push roda `vitest run`.

**Plugins ESLint obrigatórios**:
- `@typescript-eslint/recommended-type-checked`
- `eslint-plugin-react-hooks`
- `eslint-plugin-jsx-a11y`
- `eslint-plugin-import` (sem imports circulares entre features)
