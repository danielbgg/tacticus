# Personal Chess Trainer — Constituição do Projeto

**Versão:** 1.0  
**Data:** 2026-05-23  
**Referência funcional:** `SPEC.md`

Esta constituição define padrões inegociáveis de código, testes, UX e performance.
Todo código submetido ao projeto — por humanos ou agentes — deve cumprir estas regras.
Em caso de conflito entre velocidade de entrega e qualidade, a qualidade prevalece.

---

## 1. Stack Tecnológica Oficial

| Camada | Tecnologia | Versão mínima |
|---|---|---|
| Linguagem | TypeScript | 5.5 (strict mode obrigatório) |
| Framework UI | React | 19 |
| Build tool | Vite | 6 |
| Desktop wrapper | Tauri | 2 |
| Tabuleiro | `react-chessboard` + `chess.js` | latest |
| Motor de xadrez | Stockfish WASM | 16 |
| Banco de dados | SQLite via `tauri-plugin-sql` | — |
| Estilo | Tailwind CSS v4 | 4 |
| Componentes base | shadcn/ui (headless, sem lock-in) | latest |
| Animações | Framer Motion | 11 |
| Estado global | Zustand | 5 |
| Estado servidor/cache | TanStack Query | 5 |
| Formulários | React Hook Form + Zod | latest |
| Testes unitários | Vitest | 2 |
| Testes de componente | Testing Library (React) | 16 |
| Testes E2E | Playwright | 1.45+ |
| Linter | ESLint 9 (flat config) | 9 |
| Formatter | Prettier | 3 |
| Git hooks | Lefthook | 1.6+ |

Nenhuma dependência fora desta lista pode ser adicionada sem aprovação explícita e registro de decisão em `docs/decisions/`.

---

## 2. Padrões de Código

### 2.1 TypeScript

- `strict: true` no `tsconfig.json` — sem exceções
- `noUncheckedIndexedAccess: true` — acesso a arrays e objetos é sempre verificado
- `exactOptionalPropertyTypes: true` — `undefined` e ausência de chave são tipos distintos
- Proibido: `any`, `as any`, `@ts-ignore` — use `unknown` + type guard ou `@ts-expect-error` com comentário obrigatório explicando por quê
- Tipos de domínio são **branded types**, não aliases simples:
  ```ts
  // ✅ correto
  type ExercicioId = string & { readonly _brand: "ExercicioId" };
  // ❌ errado
  type ExercicioId = string;
  ```
- Enums proibidos — use `as const` objects:
  ```ts
  // ✅
  const Area = { TATICA: "tatica", FINAL: "final", ESTRATEGIA: "estrategia" } as const;
  type Area = typeof Area[keyof typeof Area];
  // ❌
  enum Area { TATICA, FINAL, ESTRATEGIA }
  ```
- Funções puras preferidas a classes para lógica de domínio
- `Result<T, E>` pattern (neverthrow ou implementação própria) para operações que podem falhar — nunca `throw` em lógica de domínio

### 2.2 Nomenclatura

| Contexto | Convenção | Exemplo |
|---|---|---|
| Componentes React | PascalCase | `ExercicioCard.tsx` |
| Hooks | camelCase prefixado `use` | `useProgresso.ts` |
| Stores Zustand | camelCase prefixado `use`, sufixo `Store` | `usePerfilStore.ts` |
| Funções utilitárias | camelCase | `calcularProximaRevisao.ts` |
| Tipos e interfaces | PascalCase | `Exercicio`, `PartidaOrigem` |
| Constantes | SCREAMING_SNAKE_CASE | `MAX_DICAS_POR_EXERCICIO` |
| Arquivos não-componente | kebab-case | `spaced-repetition.ts` |
| Variáveis | camelCase, descritivas | `acertosConsecutivos` (não `n`, `count`, `val`) |

Nomes devem ser auto-documentados. Comentários explicam **por quê**, nunca **o quê**.

### 2.3 Estrutura de Arquivos

```
src/
├── app/                    # Rotas e layouts (file-based routing via TanStack Router)
├── features/               # Funcionalidades por domínio
│   ├── exercicio/
│   │   ├── components/     # Componentes exclusivos desta feature
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── domain/         # Lógica pura (sem React, sem I/O)
│   │   └── index.ts        # Barrel export — só o que é público
│   ├── perfil/
│   ├── sessao/
│   ├── estatisticas/
│   └── banco-exercicios/
├── shared/
│   ├── components/         # Design system — componentes reutilizáveis
│   ├── hooks/              # Hooks utilitários genéricos
│   ├── lib/                # Utilitários sem dependência de React
│   │   ├── sm2.ts          # Algoritmo SM-2
│   │   ├── chess-utils.ts
│   │   └── date.ts
│   └── types/              # Tipos de domínio compartilhados
├── db/
│   ├── schema.ts           # Definição de tabelas SQLite
│   ├── migrations/         # Arquivos SQL versionados
│   └── queries/            # Queries tipadas por entidade
└── main.tsx
```

Regra de dependência: `features/` nunca importa de outra `feature/` diretamente.
Comunicação entre features via store compartilhado em `shared/` ou eventos.

### 2.4 Componentes React

- Componentes são **funções**, nunca classes
- Props são tipadas com interface nomeada (`ExercicioBoardProps`), nunca tipo inline
- Componentes com mais de ~150 linhas devem ser decompostos
- Efeitos colaterais (`useEffect`) são a última opção — prefira derivação de estado, event handlers ou TanStack Query
- `useEffect` sempre com array de dependências explícito; sem eslint-disable
- Memoização (`useMemo`, `useCallback`, `React.memo`) só onde há evidência de problema de performance, nunca por precaução
- Componentes puros (sem estado) são preferidos e testados primeiro

### 2.5 Tratamento de Erros

- Boundaries de erro (`ErrorBoundary`) em toda route e em componentes de I/O
- Erros de banco de dados nunca chegam ao JSX — são tratados na camada `db/queries/`
- Mensagens de erro visíveis ao usuário são claras, humanas e sem stack trace
- Erros inesperados são logados localmente (arquivo de log rotativo, nunca console em produção)

---

## 3. Banco de Dados

### 3.1 Migrations

- Cada alteração de schema é um arquivo SQL numerado sequencialmente: `0001_init.sql`, `0002_add_partidas.sql`
- Migrations são **apenas aditivas** na v1 (sem DROP COLUMN, sem RENAME sem alias)
- Toda migration tem rollback documentado em comentário no topo do arquivo
- Schema é validado contra tipos TypeScript via script de geração automática

### 3.2 Queries

- Sem strings SQL inline em componentes ou hooks — todas as queries ficam em `db/queries/`
- Queries são funções tipadas: `buscarExercicio(id: ExercicioId): Promise<Result<Exercicio, DbError>>`
- Índices são definidos explicitamente no schema para todas as FK e colunas de filtro frequente
- Transações para operações que alteram mais de uma tabela

### 3.3 Performance de Banco

- Queries de UI devem completar em < 20ms (P95) em banco com 100k tentativas
- Nenhuma query N+1 — joins ou batch loading obrigatórios
- WAL mode habilitado no SQLite
- Vacuum agendado semanal

---

## 4. Padrões de Testes

### 4.1 Pirâmide de Testes

```
         [ E2E — Playwright ]          ~10% dos testes
       [ Integração — Vitest ]          ~20%
    [ Unitários — Vitest + RTL ]        ~70%
```

### 4.2 Cobertura Mínima Obrigatória

| Camada | Cobertura mínima |
|---|---|
| `features/*/domain/` | **95%** — lógica pura crítica |
| `shared/lib/` | **95%** — utilitários compartilhados |
| `db/queries/` | **85%** — integração com banco real (não mock) |
| `features/*/components/` | **70%** — comportamento visível ao usuário |
| `features/*/hooks/` | **80%** |

CI falha se qualquer threshold for violado.

### 4.3 Testes Unitários (Vitest)

- Um arquivo de teste por arquivo de produção: `sm2.ts` → `sm2.test.ts`
- Testes nomeados descritivamente: `it("deve reiniciar fator_facilidade para 2.5 após erro")`
- Sem mocks de módulos inteiros — prefira injeção de dependência
- Banco de dados nunca é mockado — use banco SQLite em memória nos testes
- Dados de teste via factories (`createExercicioFactory(overrides)`) — sem fixtures de arquivo JSON
- Sem `describe` aninhados além de 2 níveis

### 4.4 Testes de Componente (Testing Library)

- Teste o que o usuário vê e faz, não detalhes de implementação
- Queries por papel semântico (`getByRole`, `getByLabelText`) — nunca por classe CSS ou data-testid genérico
- `data-testid` aceito apenas quando não há alternativa semântica, e com nome descritivo (`data-testid="contador-acertos-consecutivos"`)
- Sem snapshots de componentes completos — snapshots só para saída de funções puras de formatação

### 4.5 Testes E2E (Playwright)

Cobrem os **fluxos críticos** do usuário:
1. Criar perfil → iniciar primeira sessão de treinamento → completar exercício → ver resumo
2. Errar exercício → receber feedback → exercício volta na fila → acertar na repetição
3. Verificar que progresso é persistido após fechar e reabrir o app
4. Trocar tema visual → confirmar que preferência persiste por perfil
5. Filtrar banco de exercícios por jogador + ECO → abrir partida completa

- Playwright em modo headed para desenvolvimento, headless em CI
- Screenshots automáticas em falhas de E2E
- Sem `page.waitForTimeout()` — use `page.waitForSelector()` ou `expect(locator).toBeVisible()`

### 4.6 Regras Gerais de Teste

- Testes são cidadãos de primeira classe — são refatorados junto com o código de produção
- Um teste que passa por razões erradas é pior que nenhum teste
- TDD para lógica de domínio (SM-2, progressão, fila de sessão) — escreva o teste antes
- Proibido: `test.skip`, `test.only` em branches que vão para main
- Proibido: `setTimeout` ou `Date.now()` hardcoded em testes — use `vi.useFakeTimers()`

---

## 5. Padrões de UX e Design System

### 5.1 Design Tokens

Todas as cores, espaçamentos, tipografia e raios de borda são definidos como tokens em `tailwind.config.ts` e `src/shared/tokens.ts`. Nenhum valor hardcoded no JSX.

```ts
// ✅ correto
<div className="bg-surface-primary text-content-primary p-4 rounded-card">
// ❌ errado
<div style={{ backgroundColor: "#1a1a2e", padding: "16px", borderRadius: "8px" }}>
```

### 5.2 Componentes do Design System

Localizados em `src/shared/components/`. Cada componente:
- Tem variantes codificadas com `class-variance-authority` (CVA)
- É acessível por padrão (ARIA, navegação por teclado, foco visível)
- Tem Storybook story com todas as variantes documentadas
- Tem teste de acessibilidade via `axe-core` no Storybook

Componentes obrigatórios no design system antes de começar features:
`Button`, `Card`, `Badge`, `Progress`, `Dialog`, `Tooltip`, `Tabs`, `Select`, `Switch`, `Avatar`, `Skeleton` (loading state), `ErrorMessage`, `EmptyState`

### 5.3 Estados de UI Obrigatórios

Todo componente que carrega dados deve implementar **todos** os 4 estados:

| Estado | Requisito |
|---|---|
| **Loading** | Skeleton animado com mesmas dimensões do conteúdo real |
| **Sucesso** | Conteúdo principal |
| **Erro** | Mensagem amigável + botão "Tentar novamente" |
| **Vazio** | Ilustração + texto motivacional + ação sugerida |

### 5.4 Feedback e Animações

- Toda ação do usuário tem resposta visual em < 100ms (mesmo que o dado demore mais)
- Transições de página: fade + slide suave (200ms, `ease-out`)
- Feedback de acerto: seta verde animada (300ms) + som + micro-animação no contador
- Feedback de erro: shake sutil na peça (400ms, sem vermelho agressivo) + som neutro
- Conquistas: toast no canto superior direito, 3s, com ícone + nome da conquista
- Animações respeitam `prefers-reduced-motion` — todas as animações têm fallback instantâneo
- Nenhuma animação bloqueia interação do usuário (use `pointer-events: none` só durante animações < 200ms)

### 5.5 Consistência de Interação

- Ações destrutivas (excluir perfil, resetar progresso) sempre pedem confirmação em Dialog
- Ações reversíveis (marcar exercício como não-iniciado) oferecem undo via toast por 5s
- Formulários validam em `onBlur`, não em `onChange` — sem mensagens de erro enquanto o usuário digita
- Placeholders não substituem labels — todo campo de formulário tem label visível
- Erros de validação são exibidos abaixo do campo, com ícone, em cor de acento de erro (nunca só por cor)
- Botões de submit mostram estado de loading e ficam desabilitados durante a operação

### 5.6 Teclado e Acessibilidade

- Toda funcionalidade acessível via teclado (Tab, Enter, Escape, setas)
- Foco sempre visível (`focus-visible`, nunca `outline: none` sem substituto)
- Atalhos de teclado listados em modal de ajuda (`?`)
- Screen readers: landmarks semânticos (`main`, `nav`, `aside`), `aria-live` para atualizações dinâmicas (contador de acertos, timer)
- Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande (WCAG AA)
- Imagens decorativas com `alt=""`, imagens informativas com alt descritivo

---

## 6. Performance

### 6.1 Orçamentos de Performance (Hard Limits)

| Métrica | Limite |
|---|---|
| Cold start do app (Tauri) | < 1.5s até tela interativa |
| Carregamento de tela (navegação interna) | < 200ms |
| Primeira posição do tabuleiro renderizada | < 50ms |
| Resposta ao lance do usuário (animação iniciada) | < 16ms (1 frame a 60fps) |
| Query de banco de dados (UI path) | < 20ms P95 |
| Bundle JS inicial (sem Stockfish WASM) | < 500KB gzip |
| Stockfish WASM | carregado em background, nunca bloqueia UI |

CI mede e falha builds que violem estes limites.

### 6.2 Rendering

- Listas longas (banco de exercícios, histórico de sessões) usam virtualização (`@tanstack/virtual`)
- Componentes pesados (visualizador de partida, editor de banco) são lazy-loaded via `React.lazy`
- Imagens de peças são SVGs inline ou sprites — nunca raster
- O tabuleiro (canvas/SVG) não re-renderiza por mudanças de estado não relacionadas — isolado em componente memorizado
- Zustand stores são segmentados por domínio — sem store global monolítica

### 6.3 Stockfish e Motor

- Stockfish roda em **Web Worker** dedicado — nunca na thread principal
- Análise começa apenas após o usuário solicitar (botão explícito) — nunca automaticamente durante treino
- Resultado da análise tem timeout de 5s — após isso, exibe aviso e cancela

### 6.4 Banco de Dados

- Todas as queries de leitura em background thread (Tauri async commands)
- Writes críticos (gravar tentativa) são fire-and-forget com confirmação assíncrona
- Índices obrigatórios:
  - `progresso_exercicio(perfil_id, status)`
  - `progresso_exercicio(perfil_id, proximo_review)`
  - `tentativas(perfil_id, timestamp)`
  - `tentativas(exercicio_id)`
  - `exercicios(area, modulo, unidade)`
  - `partidas(ano)`, `partidas(eco)`

---

## 7. Segurança e Dados do Usuário

- Dados do usuário armazenados **exclusivamente no dispositivo local** — nenhuma telemetria, nenhuma chamada de rede sem consentimento explícito
- Banco SQLite em diretório de dados do app (não acessível a outros apps via Tauri permissions)
- Export de dados em formato aberto (SQLite ou JSON) disponível nas configurações — o usuário é dono dos seus dados
- Sem analytics de terceiros na v1
- URLs externas (partidas de referência) abertas no browser padrão do sistema, nunca em webview embutido

---

## 8. Git e Workflow

### 8.1 Commits

- Formato: **Conventional Commits** obrigatório
  ```
  feat(exercicio): adicionar sistema de dicas em 3 níveis
  fix(sm2): corrigir cálculo de fator_facilidade após erro consecutivo
  test(perfil): adicionar testes E2E para troca de perfil
  refactor(db): extrair queries de sessão para módulo dedicado
  ```
- Commits atômicos — um assunto por commit
- Proibido commitar: código comentado, `console.log`, `debugger`, `TODO` sem issue vinculada

### 8.2 Branches

```
main          ← produção, protegida
dev           ← integração contínua
feat/<nome>   ← features novas
fix/<nome>    ← correções
chore/<nome>  ← infra, deps, config
```

### 8.3 Pull Requests

- PR requer: todos os testes passando + linter limpo + cobertura mantida
- Descrição obrigatória: o que muda, por que, como testar manualmente
- Sem self-merge em `main`

### 8.4 Hooks (Lefthook)

```
pre-commit:
  - lint-staged (ESLint + Prettier nos arquivos alterados)
  - tsc --noEmit

pre-push:
  - vitest run (testes unitários)

commit-msg:
  - commitlint (valida formato Conventional Commits)
```

---

## 9. Internacionalização (i18n)

- Biblioteca: `react-i18next`
- Idiomas v1: Português (PT-BR), Inglês (EN), Espanhol (ES)
- Zero string hardcoded no JSX — todas via `t("chave.de.traducao")`
- Chaves organizadas por feature: `exercicio.dica.nivel1`, `perfil.criar.titulo`
- Pluralização usando recursos nativos do i18next (`_one`, `_other`)
- Nomes de peças, notação de lances e termos de xadrez mantidos em inglês no código mas traduzidos na UI

---

## 10. Documentação

- `SPEC.md` — especificação funcional (fonte da verdade de produto)
- `CONSTITUTION.md` — este documento (fonte da verdade técnica)
- `docs/decisions/` — Architecture Decision Records (ADR) para cada decisão não-óbvia
- `docs/api/` — documentação gerada de types públicos via TypeDoc
- Storybook — documentação viva do design system
- READMEs em `src/features/<feature>/` explicam o domínio, não o código

Código auto-documentado é preferido. Comentários de bloco longos são um sinal de que o código precisa ser refatorado, não explicado.

---

## 11. Checklist de Qualidade (antes de qualquer PR)

- [ ] TypeScript compila sem erros (`tsc --noEmit`)
- [ ] ESLint sem warnings ou erros
- [ ] Prettier aplicado
- [ ] Todos os testes passam
- [ ] Cobertura não regrediu
- [ ] Todos os 4 estados de UI implementados (loading, sucesso, erro, vazio)
- [ ] Acessível por teclado
- [ ] Animações respeitam `prefers-reduced-motion`
- [ ] Nenhuma string hardcoded no JSX
- [ ] Nenhuma query N+1
- [ ] Performance budget mantido (bundle size, tempo de resposta)
- [ ] Dados do usuário não saem do dispositivo
