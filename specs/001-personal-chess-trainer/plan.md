# Implementation Plan: Personal Chess Trainer

**Branch**: `main` | **Date**: 2026-05-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-personal-chess-trainer/spec.md`

---

## Summary

Aplicação desktop de treinamento de xadrez que implementa o método de repetição progressiva (Chessimo Circles) combinado com revisão espaçada (SM-2). O usuário treina posições táticas, de finais e de estratégia com feedback imediato, progresso persistente por perfil e personalização visual completa. A stack é Tauri 2 (shell nativa) + React 19 + TypeScript 5.5 + SQLite local.

---

## Technical Context

**Language/Version**: TypeScript 5.5 (strict mode), Rust (Tauri runtime — sem código Rust de produto)

**Primary Dependencies**:
- UI: React 19, Vite 6, Tailwind CSS v4, shadcn/ui, Framer Motion 11
- Tabuleiro: `react-chessboard` + `chess.js`
- Estado: Zustand 5 (global), TanStack Query 5 (server/cache)
- Formulários: React Hook Form + Zod
- Motor: Stockfish 16 WASM (Web Worker dedicado)
- i18n: react-i18next

**Storage**: SQLite via `tauri-plugin-sql` — banco local no diretório de dados do app

**Testing**: Vitest 2 (unit + integração), Testing Library React 16 (componentes), Playwright 1.45 (E2E)

**Target Platform**: macOS 13+, Windows 10+, Linux (Debian/Ubuntu) — desktop via Tauri 2

**Project Type**: Desktop application (Tauri wrapper sobre SPA React)

**Performance Goals**:
- Cold start < 1,5s
- Resposta ao lance do usuário < 16ms (1 frame @ 60fps)
- Query de banco de dados < 20ms P95
- Bundle JS inicial (sem Stockfish WASM) < 500KB gzip

**Constraints**:
- 100% offline — sem dependência de rede para funcionalidade principal
- Dados exclusivamente locais — sem telemetria ou sync em nuvem
- SQLite em WAL mode — banco tolerante a banco com 500k+ registros de tentativas

**Scale/Scope**:
- Banco de exercícios: ~6.420 exercícios padrão + exercícios customizados
- Histórico: até 500.000 registros de tentativas por perfil
- Perfis: múltiplos por dispositivo (sem limite prático)
- Telas principais: ~12 (Home, Treinar, Exercício, Revisão, Estatísticas, Banco, Editor, Configurações, Perfil, Conquistas, Partida, Análise)

---

## Constitution Check

*GATE: verificado antes da Phase 0. Re-verificado após Phase 1.*

| Princípio | Status | Observação |
|---|---|---|
| TypeScript strict + branded types | ✅ | Toda a stack tipada; `ExercicioId`, `PerfilId`, `SessaoId` como branded types |
| Sem `any` / `@ts-ignore` | ✅ | Enforçado via ESLint |
| Componentes como funções | ✅ | Nenhuma classe React |
| Estrutura por feature (`src/features/`) | ✅ | Ver Project Structure abaixo |
| Banco não mockado nos testes | ✅ | SQLite em memória nos testes de integração |
| Cobertura mínima por camada | ✅ | 95% domínio, 85% queries, 70% componentes |
| Todos os 4 estados de UI | ✅ | Skeleton, sucesso, erro, vazio — por componente |
| Stockfish em Web Worker | ✅ | Nunca na thread principal |
| Dados 100% locais | ✅ | Nenhuma chamada de rede sem consentimento |
| `prefers-reduced-motion` | ✅ | Todas as animações têm fallback |
| i18n: zero strings hardcoded | ✅ | react-i18next em toda a UI |

**Resultado: GATE APROVADO** — nenhuma violação identificada.

---

## Project Structure

### Documentation (esta feature)

```text
specs/001-personal-chess-trainer/
├── plan.md              ← este arquivo
├── research.md          ← decisões técnicas com rationale
├── data-model.md        ← entidades, relacionamentos, schema SQLite
├── quickstart.md        ← como rodar o projeto do zero
├── contracts/
│   ├── ui-state.md      ← contratos de estado de UI por tela
│   └── worker-api.md    ← API do Web Worker do Stockfish
└── tasks.md             ← gerado por /speckit-tasks
```

### Source Code

```text
src-tauri/               # Shell Tauri (Rust — configuração apenas)
├── tauri.conf.json
├── capabilities/        # Permissões Tauri 2
└── Cargo.toml

src/                     # Aplicação React + TypeScript
├── main.tsx
├── app/                 # Roteamento (TanStack Router)
│   ├── router.tsx
│   ├── layouts/
│   │   ├── AppLayout.tsx
│   │   └── TrainingLayout.tsx
│   └── routes/
│       ├── index.tsx           # Seleção de perfil / Home
│       ├── perfil/
│       ├── treinar/
│       ├── exercicio/
│       ├── revisao/
│       ├── estatisticas/
│       ├── banco/
│       └── configuracoes/
│
├── features/
│   ├── perfil/
│   │   ├── components/         # PerfilCard, PerfilForm, AvatarPicker
│   │   ├── hooks/              # usePerfis, usePerfilAtivo
│   │   ├── store/              # usePerfilStore.ts
│   │   ├── domain/             # validarPerfil.ts, nivelParaCurriculo.ts
│   │   └── index.ts
│   │
│   ├── exercicio/
│   │   ├── components/         # ExercicioBoard, HintPanel, OrigemPartida, FeedbackOverlay
│   │   ├── hooks/              # useExercicio, useDica, useMotor
│   │   ├── store/              # useExercicioStore.ts
│   │   ├── domain/
│   │   │   ├── validar-lance.ts
│   │   │   ├── fila-sessao.ts
│   │   │   └── sm2.ts          # Algoritmo SM-2
│   │   └── index.ts
│   │
│   ├── sessao/
│   │   ├── components/         # SessaoResumo, ProgressBar, ConquistasToast
│   │   ├── hooks/              # useSessao, useXP
│   │   ├── store/              # useSessaoStore.ts
│   │   ├── domain/
│   │   │   ├── calcular-xp.ts
│   │   │   ├── montar-fila.ts
│   │   │   └── conquistas.ts
│   │   └── index.ts
│   │
│   ├── estatisticas/
│   │   ├── components/         # Heatmap, RadarChart, PontosFracos, HistoricoSessoes
│   │   ├── hooks/              # useEstatisticas, usePontosFracos
│   │   ├── domain/             # calcular-taxa-acerto.ts, detectar-pontos-fracos.ts
│   │   └── index.ts
│   │
│   └── banco-exercicios/
│       ├── components/         # ExercicioList, ExercicioEditor, ImportadorPGN, VisualizadorPartida
│       ├── hooks/              # useBanco, useImportarPGN
│       ├── domain/             # parsear-pgn.ts, extrair-posicoes-chave.ts
│       └── index.ts
│
├── shared/
│   ├── components/             # Design system
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Badge/
│   │   ├── Progress/
│   │   ├── Dialog/
│   │   ├── Tooltip/
│   │   ├── Skeleton/
│   │   ├── EmptyState/
│   │   ├── ErrorMessage/
│   │   ├── Tabuleiro/          # Wrapper react-chessboard com tokens visuais
│   │   └── VisualizadorLances/ # Navegador de PGN
│   │
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── useKeyboard.ts
│   │
│   ├── lib/
│   │   ├── sm2.ts              # Algoritmo SM-2 puro (sem deps React)
│   │   ├── chess-utils.ts      # Utilitários chess.js
│   │   ├── pgn-parser.ts       # Parser PGN
│   │   ├── date.ts
│   │   └── result.ts           # Result<T,E> pattern
│   │
│   ├── types/
│   │   ├── branded.ts          # ExercicioId, PerfilId, SessaoId, etc.
│   │   ├── domain.ts           # Exercicio, Perfil, Tentativa, Sessao, Partida, etc.
│   │   └── ui.ts               # EstadoUI, Tema, ConjuntoPecas, etc.
│   │
│   └── workers/
│       └── stockfish.worker.ts # Web Worker Stockfish
│
└── db/
    ├── schema.ts               # Definição de tabelas e índices
    ├── migrations/
    │   ├── 0001_init.sql
    │   ├── 0002_add_partidas.sql
    │   └── 0003_add_conquistas.sql
    └── queries/
        ├── perfis.ts
        ├── exercicios.ts
        ├── progresso.ts
        ├── tentativas.ts
        ├── sessoes.ts
        ├── partidas.ts
        └── estatisticas.ts

tests/
├── unit/                       # Vitest — lógica pura
│   ├── sm2.test.ts
│   ├── fila-sessao.test.ts
│   ├── calcular-xp.test.ts
│   ├── pgn-parser.test.ts
│   └── conquistas.test.ts
├── integration/                # Vitest — com SQLite em memória
│   ├── queries/
│   │   ├── progresso.test.ts
│   │   ├── tentativas.test.ts
│   │   └── estatisticas.test.ts
│   └── sessao.test.ts
└── e2e/                        # Playwright
    ├── criar-perfil.spec.ts
    ├── treinar-exercicio.spec.ts
    ├── persistencia.spec.ts
    ├── look-and-feel.spec.ts
    └── banco-exercicios.spec.ts
```

**Structure Decision**: Estrutura por feature com camada de domínio pura. Features nunca se importam diretamente — comunicação via stores Zustand ou eventos. Banco de dados isolado em `src/db/` com queries tipadas. Workers isolados em `src/shared/workers/`.

---

## Complexity Tracking

Nenhuma violação da Constituição identificada. Seção não aplicável.
