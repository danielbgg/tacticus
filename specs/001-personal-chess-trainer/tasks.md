# Tasks: Personal Chess Trainer

**Input**: `specs/001-personal-chess-trainer/` (plan.md, spec.md, data-model.md, contracts/, research.md)

**Formato**: `[ID] [P?] [Story?] Descrição com caminho de arquivo`
- **[P]**: paralelizável (arquivos distintos, sem dependência de tarefa incompleta)
- **[Story]**: user story correspondente (US1–US7)
- Testes de domínio: escritos **antes** da implementação (TDD — ver Constituição §4.6)

---

## Phase 1: Setup — Scaffold e Ferramentas

**Propósito**: Projeto funcional com todos os toolings configurados antes de qualquer código de produto.

- [x] T001 Criar projeto Tauri 2 + React 19 + TypeScript 5.5: `pnpm create tauri-app personal-chess-trainer --template react-ts`, ajustar `tsconfig.json` com `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- [x] T002 Instalar e configurar Tailwind CSS v4 em `vite.config.ts` e `src/index.css`
- [x] T003 [P] Instalar e configurar ESLint 9 flat config (`eslint.config.ts`) com plugins: `@typescript-eslint/recommended-type-checked`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`
- [x] T004 [P] Configurar Prettier 3 em `.prettierrc` e integrar com ESLint via `eslint-config-prettier`
- [x] T005 [P] Configurar Lefthook em `lefthook.yml`: pre-commit (lint-staged + `tsc --noEmit`), pre-push (`vitest run`), commit-msg (commitlint)
- [x] T006 Instalar TanStack Router e configurar file-based routing em `src/app/router.tsx` com rotas: `/`, `/home`, `/treinar/:unidadeId`, `/revisao`, `/estatisticas`, `/banco`, `/configuracoes`
- [x] T007 [P] Instalar e configurar react-i18next com namespaces por feature em `src/shared/lib/i18n.ts`; criar arquivos de locale em `src/locales/{pt-BR,en,es}/{perfil,exercicio,sessao,estatisticas,banco,comum}.json`
- [x] T008 [P] Instalar Framer Motion 11, Zustand 5, TanStack Query 5, React Hook Form + Zod, shadcn/ui (init), chess.js, react-chessboard
- [x] T009 [P] Configurar Vitest 2 em `vitest.config.ts` com coverage (thresholds: domínio 95%, queries 85%, componentes 70%), Testing Library React 16
- [x] T010 [P] Configurar Playwright em `playwright.config.ts` para E2E — 5 spec files vazios criados em `tests/e2e/`
- [x] T011 Criar estrutura de diretórios completa conforme `plan.md`: `src/{app,features,shared,db,workers}/` e `tests/{unit,integration,e2e}/`

---

## Phase 2: Foundational — Infraestrutura Bloqueante

**Propósito**: Infraestrutura que TODOS os user stories dependem. Nenhum US pode iniciar antes desta fase.

**⚠️ CRÍTICO**: Completo antes de qualquer fase de user story.

### Tipos e Utilitários Base

- [x] T012 [P] Implementar branded types em `src/shared/types/branded.ts`: `PerfilId`, `ExercicioId`, `SessaoId`, `TentativaId`, `PartidaId`, `UnidadeId`, `ModuloId`, `ConquistaId`
- [x] T013 [P] Implementar tipos de domínio em `src/shared/types/domain.ts`: `Perfil`, `Exercicio`, `Partida`, `ProgressoExercicio`, `Tentativa`, `Sessao`, `LanceSan`, `Variante` e todos os union types (`NivelJogador`, `StatusExercicio`, `ModoSessao`, `TemaInterface`)
- [x] T014 [P] Implementar `Result<T,E>` pattern em `src/shared/lib/result.ts` com funções `ok()`, `err()`, `isOk()`, `isErr()`, `map()`, `flatMap()`

### Banco de Dados

- [x] T015 Instalar `tauri-plugin-sql` com SQLite, configurar capabilities Tauri 2 em `src-tauri/capabilities/`
- [x] T016 Implementar sistema de migrations em `src/db/migrations/`: runner que aplica arquivos SQL sequencialmente na inicialização; criar `0001_init.sql` com schema completo de `data-model.md` (todas as 9 tabelas + índices)
- [x] T017 [P] Criar `src/db/migrations/0002_add_conquistas.sql`: tabelas `conquistas` e `conquistas_perfil` + seed das conquistas padrão
- [x] T018 Implementar queries base tipadas em `src/db/queries/`: factory de conexão, helper de execute/select com tipos genéricos, tratamento `Result<T, DbError>`

### Algoritmo SM-2 (TDD)

- [x] T019 **[TDD — escrever teste primeiro]** Criar `tests/unit/sm2.test.ts` com casos: acerto simples, acerto consecutivo até domínio, erro reinicia contador, penalidade de dica, fator_facilidade nunca abaixo de 1.3, intervalos corretos por repetição — todos devem **falhar** antes de T020
- [x] T020 Implementar `src/shared/lib/sm2.ts`: funções puras `calcularProximaRevisao(progresso, acertou, dicasUsadas, tempoMs)` e `inicializarProgresso()` — fazer T019 passar

### Design System Base

- [x] T021 [P] Implementar componentes `Button`, `Badge`, `Progress` em `src/shared/components/` com variantes CVA, acessibilidade ARIA e suporte a `prefers-reduced-motion`
- [x] T022 [P] Implementar `Card`, `Dialog`, `Tooltip`, `Tabs`, `Select`, `Switch` em `src/shared/components/` com mesmos padrões
- [x] T023 [P] Implementar `Skeleton`, `EmptyState`, `ErrorMessage` em `src/shared/components/` — os 4 estados obrigatórios de UI
- [x] T024 Implementar `AppLayout.tsx` e `TrainingLayout.tsx` em `src/app/layouts/` com barra lateral recolhível, breadcrumb e área de conteúdo

### Wrapper do Tabuleiro

- [x] T025 Implementar `src/shared/components/Tabuleiro/Tabuleiro.tsx`: wrapper de `react-chessboard` com tokens de design (estilos de tabuleiro, conjuntos de peças), suporte a setas/highlights por clique-direito, destaque do último lance, modo daltônico e `prefers-reduced-motion`
- [x] T026 [P] Implementar utilitários de xadrez em `src/shared/lib/chess-utils.ts`: validar FEN, extrair informações de posição, converter UCI↔SAN usando `chess.js`

**Checkpoint**: Infraestrutura pronta — user stories podem iniciar em paralelo após esta fase.

---

## Phase 3: US2 — Criar e Selecionar Perfil (P1)

**Goal**: Usuário cria perfil com nome, avatar e nível; múltiplos perfis são gerenciados e selecionados na abertura do app.

**Independent Test**: Criar dois perfis distintos, treinar em um, verificar que o outro não tem progresso.

### Queries e Store (TDD)

- [x] T027 **[TDD]** Criar `tests/integration/queries/perfis.test.ts` com SQLite em memória: criar perfil, buscar todos, buscar por id, atualizar último acesso — deve **falhar** antes de T028
- [x] T028 [US2] Implementar `src/db/queries/perfis.ts`: `criarPerfil()`, `buscarTodosPerfis()`, `buscarPerfilPorId()`, `atualizarUltimoAcesso()`, `atualizarConfiguracoes()` — fazer T027 passar
- [x] T029 [US2] Implementar `src/db/queries/configuracoes.ts`: `buscarConfiguracoes()`, `salvarConfiguracoes()` com validação Zod
- [x] T030 [US2] Implementar `src/features/perfil/store/usePerfilStore.ts` (Zustand): estado `perfilAtivo`, ações `selecionarPerfil()`, `atualizarConfiguracoes()`
- [x] T031 [US2] Implementar hooks `src/features/perfil/hooks/usePerfis.ts` (TanStack Query) e `usePerfilAtivo.ts`

### Lógica de Domínio (TDD)

- [x] T032 **[TDD]** Criar `tests/unit/nivel-curriculo.test.ts`: mapear nível → módulo sugerido de início — falhar antes de T033
- [x] T033 [P] [US2] Implementar `src/features/perfil/domain/nivelParaCurriculo.ts` e `validarPerfil.ts` — fazer T032 passar

### Componentes e Telas

- [x] T034 [P] [US2] Implementar `src/features/perfil/components/AvatarPicker.tsx`: grid de emojis + upload de imagem local
- [x] T035 [P] [US2] Implementar `src/features/perfil/components/PerfilForm.tsx` com React Hook Form + Zod: campos nome, avatar, nível, ELO opcional
- [x] T036 [US2] Implementar `src/features/perfil/components/PerfilCard.tsx`: card com avatar, nome, nível (XP → nível 1–100), streak, último acesso — 4 estados obrigatórios
- [x] T037 [US2] Implementar rota `/` em `src/app/routes/index.tsx`: tela de seleção de perfil (cards + botão "Novo Perfil") com redirect automático se 1 perfil, redirect para criação se nenhum
- [x] T038 [US2] Implementar rota de criação de perfil `/perfil/novo` com PerfilForm + sugestão de currículo pós-criação

**Checkpoint**: Perfis funcionam isoladamente — criar, selecionar, persistir.

---

## Phase 4: US1 — Sessão de Treinamento (P1)

**Goal**: Usuário inicia sessão, resolve exercícios com feedback imediato, exercícios errados voltam à fila, resumo ao final.

**Independent Test**: Iniciar sessão numa unidade, resolver 5 exercícios (acertando e errando), ver resumo correto.

### Queries (TDD)

- [x] T039 **[TDD]** Criar `tests/integration/queries/exercicios.test.ts`: buscar exercícios por unidade, buscar por id, buscar com filtros — falhar antes de T040
- [x] T040 [US1] Implementar `src/db/queries/exercicios.ts`: `buscarExerciciosPorUnidade()`, `buscarExercicioPorId()`, `buscarAreasModulosUnidades()` — fazer T039 passar
- [x] T041 **[TDD]** Criar `tests/integration/queries/sessoes.test.ts` e `tentativas.test.ts`: criar sessão, registrar tentativa, encerrar sessão — falhar antes de T042
- [x] T042 [US1] Implementar `src/db/queries/sessoes.ts` e `src/db/queries/tentativas.ts`: `criarSessao()`, `registrarTentativa()`, `encerrarSessao()` — fazer T041 passar

### Lógica de Domínio da Sessão (TDD)

- [x] T043 **[TDD]** Criar `tests/unit/fila-sessao.test.ts`: montar fila, exercício errado volta ao final da fila, encerramento correto quando fila vazia — falhar antes de T044
- [x] T044 [US1] Implementar `src/features/exercicio/domain/fila-sessao.ts`: `montarFila()`, `proximoExercicio()`, `registrarResultado()`, `filaEsgotada()` — fazer T043 passar
- [x] T045 **[TDD]** Criar `tests/unit/calcular-xp.test.ts`: XP proporcional a dificuldade, penalidade por dicas — falhar antes de T046
- [x] T046 [P] [US1] Implementar `src/features/sessao/domain/calcular-xp.ts` e `src/features/sessao/domain/montar-fila.ts` — fazer T045 passar

### Store e Hooks da Sessão

- [x] T047 [US1] Implementar `src/features/exercicio/store/useExercicioStore.ts` (Zustand): estado `exercicioAtual`, `fase` (EstadoExercicio do contrato `ui-state.md`), `dicasUsadas`
- [x] T048 [US1] Implementar `src/features/sessao/store/useSessaoStore.ts` (Zustand): `fila`, `acertos`, `erros`, `xpGanho`
- [x] T049 [US1] Implementar `src/features/exercicio/hooks/useExercicio.ts`: orquestra store + queries + SM-2 para o fluxo de um exercício
- [x] T050 [US1] Implementar `src/features/sessao/hooks/useSessao.ts`: inicia sessão, avança fila, encerra sessão, persiste tentativas

### Componentes da Tela de Exercício

- [x] T051 [US1] Implementar `src/features/exercicio/components/FeedbackOverlay.tsx`: animação de seta verde (acerto) e shake + seta vermelha 2s (erro), sons, respeita `prefers-reduced-motion`
- [x] T052 [P] [US1] Implementar `src/features/exercicio/components/HintPanel.tsx`: botão de dica com 3 níveis visuais, contador de dicas restantes, penalidade exibida
- [x] T053 [US1] Implementar `src/features/exercicio/components/PainelInfo.tsx`: área/módulo/unidade, progresso da unidade, acertos consecutivos com micro-animação — conforme contrato `ui-state.md`
- [x] T054 [US1] Implementar rota de treinamento `src/app/routes/treinar/index.tsx` (seleção de unidade/modo) e `src/app/routes/treinar/exercicio.tsx` (layout dois painéis: tabuleiro + PainelInfo)
- [x] T055 [US1] Implementar `src/features/sessao/components/SessaoResumo.tsx`: acertos, erros, tempo, XP ganho com animação de barra de XP enchendo

**Checkpoint**: Sessão de treinamento completa — iniciar, resolver, feedback, resumo.

---

## Phase 5: US3 — Domínio pelo Método de Repetição Progressiva (P1)

**Goal**: Exercícios exigem N acertos consecutivos para serem dominados; dominados entram em revisão espaçada SM-2.

**Independent Test**: Acertar o mesmo exercício 5x seguidas → status "dominado" → próxima revisão agendada no banco.

### Queries e Integração SM-2 (TDD)

- [x] T056 **[TDD]** Criar `tests/integration/queries/progresso.test.ts`: criar progresso, atualizar acertos consecutivos, marcar como dominado, buscar revisões pendentes — falhar antes de T057
- [x] T057 [US3] Implementar `src/db/queries/progresso.ts`: `buscarProgressoExercicio()`, `atualizarProgresso()`, `buscarRevisoesPendentes()`, `buscarResumoProgresso()` — fazer T056 passar
- [x] T058 [US3] Integrar SM-2 (`src/shared/lib/sm2.ts`) no hook `useExercicio.ts`: após cada tentativa, calcular novo `fator_facilidade`, `proximo_review` e `status`, persistir via `atualizarProgresso()`
- [x] T059 [US3] Implementar lógica de desbloqueio de unidade em `src/features/exercicio/domain/fila-sessao.ts`: verificar `percentual_avanco` configurado antes de liberar próxima unidade
- [x] T060 [US3] Implementar modo **Revisão** em `src/features/sessao/domain/montar-fila.ts`: fila contém apenas `buscarRevisoesPendentes()` ordenados por `proximo_review ASC`
- [x] T061 [US3] Adicionar rota `/revisao` em `src/app/routes/revisao/index.tsx`: tela de revisão usando mesmo layout de exercício com modo "revisao"

**Checkpoint**: Método Chessimo completo — domínio por repetição + revisão espaçada funcionando end-to-end.

---

## Phase 6: US4 — Personalização Visual (P2)

**Goal**: Usuário escolhe estilo de tabuleiro, conjunto de peças, tema de interface e cor de acento; preferências persistem por perfil.

**Independent Test**: Trocar tema e conjunto de peças, fechar app, reabrir — configurações idênticas restauradas.

### Sistema de Temas

- [x] T062 [US4] Definir design tokens em `src/shared/tokens.ts` e `tailwind.config.ts`: variáveis CSS para cores de tabuleiro, tema de interface, cor de acento — 5 temas × variáveis
- [ ] T063 [P] [US4] Implementar assets SVG dos 6 conjuntos de peças em `src/assets/pieces/{staunton,merida,alpha,leipzig,cartoon,3d}/` — sprites por peça (12 SVGs por conjunto) [DEFERRED — trabalho de design]
- [ ] T064 [P] [US4] Implementar assets de estilos de tabuleiro em `src/assets/boards/` (7 variantes de textura/cor como CSS/SVG) [DEFERRED — trabalho de design]
- [x] T065 [US4] Atualizar `src/shared/components/Tabuleiro/Tabuleiro.tsx` para consumir `configuracoes.conjunto_pecas` e `configuracoes.estilo_tabuleiro` do `usePerfilStore`
- [x] T066 [US4] Implementar aplicação de tema em `src/app/layouts/AppLayout.tsx`: injetar variáveis CSS de tema + cor de acento na raiz com base no perfil ativo; mudar imediatamente ao trocar configuração

### Tela de Configurações

- [x] T067 [US4] Implementar `src/app/routes/configuracoes/index.tsx` com abas: Aparência, Treinamento, Motor, Dados, Sobre
- [x] T068 [US4] Implementar aba **Aparência**: seletor de estilo de tabuleiro (preview ao vivo), conjunto de peças, tema de interface, color picker de acento, toggle modo daltônico, sliders de volume e animação
- [x] T069 [US4] Implementar aba **Treinamento**: sliders de acertos para dominar, percentual de avanço, novos/revisões por sessão, tempo máximo por exercício, toggle de dicas
- [x] T070 [P] [US4] Implementar aba **Dados**: botão de export (escolha de pasta → progresso → confirmação), confirmação antes de reset de progresso

**Checkpoint**: Personalização visual completa e persistida por perfil.

---

## Phase 7: US5 — Progresso e Estatísticas (P2)

**Goal**: Usuário vê heatmap de atividade, taxa de acerto por tema, pontos fracos detectados automaticamente e histórico de sessões.

**Independent Test**: Após 3 sessões, heatmap mostra dias estudados, pontos fracos refletem taxa real de acerto.

### Queries de Estatísticas (TDD)

- [x] T071 **[TDD]** Criar `tests/integration/queries/estatisticas.test.ts`: contagem de dominados/em progresso, heatmap por data, taxa por tema, histórico de sessões — falhar antes de T072
- [x] T072 [US5] Implementar `src/db/queries/estatisticas.ts`: `buscarVisaoGeral()`, `buscarHeatmap()`, `buscarTaxaPorTema()`, `buscarHistoricoSessoes()`, `buscarPontosFracos()` — fazer T071 passar

### Lógica de Domínio

- [x] T073 **[TDD]** Criar `tests/unit/detectar-pontos-fracos.test.ts` — falhar antes de T074
- [x] T074 [P] [US5] Implementar `src/features/estatisticas/domain/detectar-pontos-fracos.ts` e `calcular-taxa-acerto.ts` — fazer T073 passar

### Componentes e Tela

- [x] T075 [P] [US5] Implementar `src/features/estatisticas/components/Heatmap.tsx`: grade 52×7 com intensidade de cor por quantidade de tentativas, tooltip com data e contagem
- [x] T076 [P] [US5] Implementar `src/features/estatisticas/components/RadarChart.tsx`: força relativa por área (Tática/Finais/Estratégia) com SVG inline
- [x] T077 [P] [US5] Implementar `src/features/estatisticas/components/PontosFracos.tsx`: lista top-5 temas com pior taxa + botão "Treinar este tema"
- [x] T078 [P] [US5] Implementar `src/features/estatisticas/components/HistoricoSessoes.tsx`: lista paginada (20/página) com data, duração, acertos, filtros por período
- [x] T079 [US5] Implementar rota `/estatisticas` em `src/app/routes/estatisticas/index.tsx` com 4 estados obrigatórios (loading skeleton, success, error, empty)
- [x] T080 [US5] Adicionar widget de streak + progresso geral na `Home` (`src/app/routes/home/index.tsx`)

**Checkpoint**: Dashboard completo e funcional com dados reais das sessões.

---

## Phase 8: US6 — Informações da Partida de Origem (P2)

**Goal**: Usuário expande painel discreto durante/após exercício e vê jogadores, evento, ano, ECO; pode visualizar a partida completa.

**Independent Test**: Abrir exercício com partida vinculada, expandir painel — dados corretos exibidos; exercício sem partida mostra "Exercício personalizado".

### Queries

- [x] T081 **[TDD]** Criar `tests/integration/queries/partidas.test.ts`: buscar por id, buscar por exercício, filtrar por jogador/eco/ano — falhar antes de T082
- [x] T082 [US6] Implementar `src/db/queries/partidas.ts`: `buscarPartidaPorId()`, `buscarPartidaDoExercicio()`, `filtrarPartidas()` — fazer T081 passar

### Componentes

- [x] T083 [US6] Implementar `src/features/exercicio/components/OrigemPartida.tsx`: painel recolhível com nome dos jogadores, ELO, evento, local, ano, ECO, abertura, nº do lance; botões "Ver partida completa" e "Copiar FEN"
- [x] T084 [US6] Implementar `src/shared/components/VisualizadorLances/VisualizadorLances.tsx`: lista de lances navegáveis (← →), tabuleiro sincronizado por lance, suporte a variantes; abre PGN armazenado ou URL externa
- [x] T085 [US6] Integrar `OrigemPartida` no `PainelInfo.tsx` (recolhido por padrão, expansível) — reutiliza dados já carregados pelo `useExercicio`
- [x] T086 [P] [US6] Implementar filtros de banco por jogador, eco e faixa de ano em `src/db/queries/exercicios.ts` (estende T040); expor na tela de banco

**Checkpoint**: Proveniência da partida visível e visualizador de PGN funcional.

---

## Phase 9: US7 — Gerenciar e Importar Banco de Exercícios (P3)

**Goal**: Usuário avançado adiciona exercícios via FEN/PGN, importa em lote, edita variantes e organiza em módulos customizados.

**Independent Test**: Importar PGN com 10 partidas — posições extraídas, exercícios disponíveis para treinamento, vínculo com partida preservado.

### Parser PGN (TDD)

- [x] T087 **[TDD]** Criar `tests/unit/pgn-parser.test.ts`: parsear header, extrair lances, preservar comentários, detectar posição com anotação `{[%tac]}`, rejeitar PGN malformado — falhar antes de T088
- [x] T088 [US7] Implementar `src/shared/lib/pgn-parser.ts` e `src/features/banco-exercicios/domain/extrair-posicoes-chave.ts` — fazer T087 passar

### Queries CRUD do Banco (TDD)

- [x] T089 **[TDD]** Criar `tests/integration/queries/banco.test.ts`: criar exercício customizado, atualizar, excluir (customizado), rejeitar exclusão de padrão — falhar antes de T090
- [x] T090 [US7] Implementar `src/db/queries/exercicios.ts` (estende T040): `criarExercicio()`, `atualizarExercicio()`, `excluirExercicio()` com guard `banco_customizado = 1`

### Componentes e Tela

- [x] T091 [P] [US7] Implementar `src/features/banco-exercicios/components/ExercicioList.tsx`: lista virtualizada (`@tanstack/virtual`), filtros por área/módulo/tema/jogador/eco/ano, paginação 50/página
- [x] T092 [P] [US7] Implementar `src/features/banco-exercicios/components/ExercicioEditor.tsx`: entrada de FEN com preview no tabuleiro, sequência de lances corretos, variantes, temas (multi-select), dificuldade, vínculo com partida
- [x] T093 [US7] Implementar `src/features/banco-exercicios/components/ImportadorPGN.tsx`: drop zone de arquivo + barra de progresso + lista de erros por partida após importação
- [x] T094 [US7] Implementar `src/features/banco-exercicios/hooks/useImportarPGN.ts`: processa PGN em chunks (não bloqueia UI), cria exercícios e partidas, reporta progresso
- [x] T095 [US7] Implementar rota `/banco` em `src/app/routes/banco/index.tsx` com ExercicioList, botão "Importar PGN", botão "Novo Exercício", 4 estados

**Checkpoint**: Import PGN funcional e editor de exercícios operacional.

---

## Phase 10: Polish e Cross-Cutting Concerns

**Propósito**: Gamificação, acessibilidade, performance, testes E2E e revisão final.

### Gamificação

- [x] T096 **[TDD]** Criar `tests/unit/conquistas.test.ts`: verificar desbloqueio por critério (100 táticas, 7 dias, mate rápido) — falhar antes de T097
- [x] T097 [P] Implementar `src/features/sessao/domain/conquistas.ts` e `src/db/queries/conquistas.ts`: avaliar critérios após cada sessão — fazer T096 passar
- [x] T098 [P] Implementar `src/features/sessao/components/ConquistasToast.tsx`: toast no canto superior direito, 3s, ícone + nome, animação de entrada

### Acessibilidade e UX

- [x] T099 [P] Implementar modal de atalhos de teclado (`?`) em `src/shared/components/KeyboardHelp.tsx`: tabela de todos os atalhos ativos na tela atual
- [x] T100 [P] Implementar `src/shared/hooks/useKeyboard.ts`: mapear teclas globais (`H`→dica, `F`→virar tabuleiro, `Enter`→próximo, `Esc`→pausar, `?`→ajuda)
- [ ] T101 Auditoria de acessibilidade: verificar contraste WCAG AA em todos os temas, `aria-live` em atualizações dinâmicas (contador, timer), navegação por teclado completa em todos os fluxos

### Web Worker Stockfish

- [x] T102 Implementar `src/shared/workers/stockfish.worker.ts` conforme contrato `contracts/worker-api.md`: mensagens tipadas `INICIALIZAR`, `ANALISAR`, `PARAR_ANALISE`, `ENCERRAR`, timeout 5s, `postMessage` tipado
- [x] T103 [P] Implementar `src/features/exercicio/hooks/useMotor.ts`: hook que gerencia ciclo de vida do worker, expõe `status`, `linhas`, `melhorLance`, `analisar()`, `parar()`
- [x] T104 [P] Integrar `useMotor` no `PainelInfo.tsx`: botão "Analisar" habilitado apenas após acerto, exibe linhas de análise em painel expansível

### Home e Onboarding

- [x] T105 Implementar `src/app/routes/home/index.tsx` completa: card "Continuar" (última unidade em progresso), card "Revisar" (revisões pendentes), barra de progresso geral, pontos fracos, streak — 4 estados

### Testes E2E (Playwright)

- [x] T106 [P] Implementar `tests/e2e/criar-perfil.spec.ts`: criar perfil → iniciar sessão → completar exercício → ver resumo
- [x] T107 [P] Implementar `tests/e2e/treinar-exercicio.spec.ts`: errar exercício → receber feedback → exercício volta na fila → acertar na repetição
- [x] T108 [P] Implementar `tests/e2e/persistencia.spec.ts`: verificar que progresso persiste após fechar e reabrir o app
- [x] T109 [P] Implementar `tests/e2e/look-and-feel.spec.ts`: trocar tema e conjunto de peças → verificar persistência por perfil
- [x] T110 [P] Implementar `tests/e2e/banco-exercicios.spec.ts`: filtrar banco por jogador + ECO → abrir partida completa

### Validação Final

- [ ] T111 Verificar orçamento de performance: bundle JS < 500KB gzip (`pnpm build && npx bundlesize`), cold start < 1,5s, resposta ao lance < 16ms (DevTools Performance)
- [ ] T112 [P] Verificar cobertura de testes: `pnpm test:coverage` — domínio ≥ 95%, queries ≥ 85%, componentes ≥ 70%
- [ ] T113 Executar checklist completo da Constituição §11 para cada feature antes de marcar como concluída
- [x] T114 [P] Completar traduções `pt-BR`, `en`, `es` em todos os namespaces i18n; verificar 0 strings hardcoded com `grep -r "t(\"" src/`
- [ ] T115 Executar `pnpm tauri build` nas 3 plataformas (macOS, Windows, Linux) e validar quickstart.md

---

## Dependencies & Execution Order

### Dependências entre Fases

```
Phase 1 (Setup)
  └── Phase 2 (Foundational)  ← BLOQUEIA TUDO
        ├── Phase 3 (US2 — Perfil)         ← pré-req de todas as outras
        │     └── Phase 4 (US1 — Sessão)   ← pré-req de Phase 5
        │           └── Phase 5 (US3 — SM-2)
        ├── Phase 6 (US4 — Look & Feel)    ← independente após Phase 3
        ├── Phase 7 (US5 — Estatísticas)   ← depende de Phase 4 (tentativas)
        ├── Phase 8 (US6 — Partida Origem) ← independente após Phase 2
        └── Phase 9 (US7 — Banco)          ← independente após Phase 2
              └── Phase 10 (Polish)        ← após todos os US desejados
```

### Dependências entre User Stories

| US | Depende de | Pode iniciar após |
|---|---|---|
| US2 — Perfil | Phase 2 | Phase 2 completa |
| US1 — Sessão | US2 (perfil ativo necessário) | Phase 3 completa |
| US3 — SM-2 | US1 (integração no loop) | Phase 4 completa |
| US4 — Look & Feel | US2 (configurações por perfil) | Phase 3 completa |
| US5 — Estatísticas | US1 (tentativas no banco) | Phase 4 completa |
| US6 — Partida Origem | Phase 2 (queries de partidas) | Phase 2 completa |
| US7 — Banco | Phase 2 (queries de exercícios) | Phase 2 completa |

### Dependências dentro de cada US

```
TDD tests (devem FALHAR) → Implementação → Tests devem PASSAR → Componentes → Tela
```

---

## Parallel Opportunities

### Fase 2 — Executar em paralelo

```
T012+T013+T014 (tipos)  ||  T019→T020 (SM-2)  ||  T021+T022+T023 (design system)  ||  T025+T026 (tabuleiro)
T015→T016→T017→T018 (banco — sequencial por dependência)
```

### Após Phase 3 concluída — US independentes em paralelo

```
US4 (Look & Feel)    ← desenvolvedor A
US6 (Partida Orig.)  ← desenvolvedor B  (ou mesmo dev após US1)
US7 (Banco)          ← desenvolvedor C  (ou após US5)
```

### Dentro de cada US — paralelo por componente

```
# US5 (Estatísticas):
T075 (Heatmap)  ||  T076 (RadarChart)  ||  T077 (PontosFracos)  ||  T078 (Histórico)
# todos dependem de T072 (queries)
```

---

## Implementation Strategy

### MVP (US2 + US1 + US3 — Phases 1–5)

1. Phase 1: Setup → Phase 2: Foundational
2. Phase 3: US2 (Perfil) → **validar:** criar dois perfis, progresso isolado ✓
3. Phase 4: US1 (Sessão) → **validar:** iniciar, resolver, feedback, resumo ✓
4. Phase 5: US3 (SM-2) → **validar:** 5 acertos consecutivos → dominado → revisão agendada ✓
5. **PARAR e DEMO**: produto mínimo utilizável para treino diário

### Entrega Incremental

- **Demo 1** (Phases 1–5): Treinamento funcional com SM-2
- **Demo 2** (+Phase 6): App personalizado visualmente
- **Demo 3** (+Phases 7–8): Estatísticas + contexto histórico das partidas
- **Demo 4** (+Phase 9): Importação de exercícios próprios
- **Release v1** (Phase 10): Qualidade, E2E, performance validados

---

## Resumo

| Fase | User Story | Tarefas | Testes TDD |
|---|---|---|---|
| Phase 1 | Setup | T001–T011 (11) | — |
| Phase 2 | Foundational | T012–T026 (15) | T019 |
| Phase 3 | US2 Perfil | T027–T038 (12) | T027, T032 |
| Phase 4 | US1 Sessão | T039–T055 (17) | T039, T041, T043, T045 |
| Phase 5 | US3 SM-2 | T056–T061 (6) | T056 |
| Phase 6 | US4 Look & Feel | T062–T070 (9) | — |
| Phase 7 | US5 Estatísticas | T071–T080 (10) | T071, T073 |
| Phase 8 | US6 Partida Origem | T081–T086 (6) | T081 |
| Phase 9 | US7 Banco | T087–T095 (9) | T087, T089 |
| Phase 10 | Polish | T096–T115 (20) | T096 |
| **Total** | | **115 tarefas** | **13 suítes TDD** |

**Oportunidades de paralelização**: 52 tarefas marcadas `[P]`
**MVP**: Phases 1–5 (61 tarefas)
