# Tacticus

**Tacticus** é um treinador tático de xadrez para desktop inspirado no método PCT (*Personal Chess Trainer*) / Chessimo. Ele aplica repetição espaçada em círculos para fixar padrões táticos de forma progressiva e cientificamente comprovada — sem depender de internet, sem assinatura, sem anúncios.

---

## O que é o Método PCT?

O método PCT organiza os exercícios em **círculos**: você resolve o mesmo conjunto de posições várias vezes, em velocidade crescente, até que os padrões se tornem automáticos. É a mesma lógica das clássicas coleções de Laszlo Polgar, usada por grandes mestres para construir visão tática.

O Tacticus implementa esse método com:
- Filas de repetição espaçada por unidade temática
- Rastreamento de acertos, erros e tempo de resposta por exercício
- Progressão automática baseada no critério de domínio configurável

---

## Funcionalidades

### Treinamento Tático
- Mais de **19.000 puzzles táticos** da [Lichess Open Database](https://database.lichess.org/#puzzles) (CC0 — domínio público), incluídos no instalador
- **10 Círculos de Treino** (rating 400–2500+): progressão pura de dificuldade para todos os níveis
- **17 Módulos Temáticos** exclusivos dos círculos: Garfo, Cravada, Espeto, Xeque-mate em 1/2/3+, Padrões de Mate, Ataque Descoberto, Desvio, Atração e mais
- Exercícios ordenados por dificuldade crescente dentro de cada módulo e unidade
- Feedback visual imediato: borda verde ao acertar, borda vermelha ao errar
- Sistema de dicas (até 3 por exercício) com seta indicando a peça a mover
- Modo "Desistir" que exibe a solução animada lance a lance

### Repetição Espaçada (SM-2)
- Algoritmo SM-2 para decidir quais exercícios revisitar e quando
- Sessões de revisão separadas do treino principal
- Critério de domínio configurável (padrão: 5 acertos consecutivos)

### Análise com Motor
- Integração com **Stockfish 10** (WASM) embutido no app
- Análise até profundidade 18, com 3 linhas simultâneas (MultiPV)
- Avaliação em centipeões e mate em N

### Estatísticas e Histórico
- Dashboard com streak de dias, progresso geral e pontos fracos
- Histórico de sessões com acertos, erros e tempo médio por exercício
- Conquistas desbloqueáveis

### Perfis e Configurações
- Múltiplos perfis de jogador no mesmo dispositivo
- Temas visual: Claro, Escuro e Madeira
- Estilos de tabuleiro: Clássico, Amadeirado, Azul, Verde e Marfim
- Modo daltônico

---

## Exercícios: como funcionam?

Os exercícios **vêm incluídos no instalador** — não é preciso baixar nada extra nem criar conta. Na primeira abertura, o Tacticus executa automaticamente as migrações SQL que populam o banco de dados SQLite local com todos os puzzles e a estrutura curricular.

Os puzzles provêm da base aberta do Lichess (licença CC0), portanto são de domínio público. O banco cresce conforme você progride: acertos, erros, tempo de resposta e progresso ficam armazenados localmente no seu dispositivo.

---

## Plataformas

| Plataforma | Suporte |
|---|---|
| macOS (Apple Silicon e Intel) | ✓ |
| Windows 10/11 | ✓ |
| Linux (x86_64) | ✓ |

---

## Instalação (binário pré-compilado)

> Em breve disponível na página de Releases do repositório.

Baixe o instalador correspondente ao seu sistema:

| Sistema | Arquivo |
|---|---|
| macOS | `Tacticus_x.x.x_aarch64.dmg` / `x64.dmg` |
| Windows | `Tacticus_x.x.x_x64-setup.exe` |
| Linux | `tacticus_x.x.x_amd64.AppImage` |

Abra o instalador, siga as instruções e pronto — nenhuma dependência adicional é necessária.

---

## Compilar a partir do código-fonte

### Pré-requisitos

| Ferramenta | Versão mínima | Como instalar |
|---|---|---|
| Node.js | 22 LTS | `nvm install 22` |
| pnpm | 9 | `npm install -g pnpm@9` |
| Rust + Cargo | 1.78+ | `curl https://sh.rustup.rs -sSf \| sh` |

**macOS:** `xcode-select --install`

**Linux (Ubuntu/Debian):**
```bash
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev
```

**Windows:** [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) + [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

---

### Clonar e instalar dependências

```bash
git clone https://github.com/seu-usuario/tacticus.git
cd tacticus
pnpm install
```

---

### Rodar em modo desenvolvimento

```bash
pnpm tauri dev
```

O app abre com hot reload — alterações no frontend refletem imediatamente sem precisar recompilar o Rust.

Para rodar apenas o frontend (sem o shell Tauri — útil para desenvolvimento de UI):
```bash
pnpm dev
# Acesse: http://localhost:1420
```

---

### Gerar o instalador de produção

```bash
pnpm tauri build
```

O instalador é gerado em `src-tauri/target/release/bundle/`:
- **macOS:** `macos/Tacticus.app` e `.dmg`
- **Windows:** `msi/` e `nsis/`
- **Linux:** `appimage/` e `deb/`

---

## Desenvolvimento

### Testes

```bash
# Testes unitários e de integração (Vitest)
pnpm test

# Modo watch
pnpm test:watch

# Cobertura de testes
pnpm test:coverage

# Testes E2E (requer app compilado com pnpm tauri build)
pnpm test:e2e
```

### Lint e type check

```bash
pnpm lint
pnpm typecheck
```

### Estrutura do projeto

```
src/
  app/           # Roteamento e layout principal
  features/      # Funcionalidades por domínio (exercicio, perfil, home, etc.)
  shared/        # Componentes e utilitários compartilhados
  db/            # Schema SQLite, queries e migrações
  workers/       # Web Worker do Stockfish
src-tauri/       # Shell nativo Tauri (Rust)
tests/
  unit/          # Testes unitários (lógica de domínio)
  integration/   # Testes de integração com SQLite in-memory
  e2e/           # Testes end-to-end com Playwright
```

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Shell nativo | Tauri 2 (Rust) |
| Frontend | React 19 + TypeScript |
| Roteamento | TanStack Router |
| Estado global | Zustand |
| Banco de dados | SQLite via `tauri-plugin-sql` |
| Motor de xadrez | Stockfish 10 (WebAssembly) |
| Tabuleiro | react-chessboard + chess.js |
| Estilos | Tailwind CSS 4 + CSS custom properties |
| Animações | Framer Motion |
| Testes | Vitest + Testing Library + Playwright |

---

## Licença

O código do Tacticus está licenciado sob **MIT**.

Os puzzles táticos incluídos são provenientes da [Lichess Open Database](https://database.lichess.org/#puzzles), licenciados sob **CC0 (domínio público)**.

O motor Stockfish é licenciado sob **GPL-3.0**.
