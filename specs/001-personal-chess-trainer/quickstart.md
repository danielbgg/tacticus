# Quickstart: Personal Chess Trainer

**Date**: 2026-05-23

---

## Pré-requisitos

| Ferramenta | Versão mínima | Instalação |
|---|---|---|
| Node.js | 22 LTS | `nvm install 22` |
| pnpm | 9 | `npm install -g pnpm@9` |
| Rust + Cargo | 1.78+ | `curl https://sh.rustup.rs -sSf \| sh` |
| Tauri CLI | 2 | `cargo install tauri-cli --version "^2"` |

**macOS apenas**: Xcode Command Line Tools → `xcode-select --install`  
**Linux apenas**: `sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev`  
**Windows apenas**: Microsoft C++ Build Tools + WebView2 Runtime

---

## Setup do Projeto

```bash
# Clonar e instalar dependências
git clone <repo-url> personal-chess-trainer
cd personal-chess-trainer
pnpm install

# Verificar requisitos Tauri
cargo tauri info
```

---

## Comandos de Desenvolvimento

```bash
# Iniciar em modo de desenvolvimento (hot reload)
pnpm tauri dev

# Apenas o frontend (sem shell Tauri — útil para UI rápida)
pnpm dev

# Testes unitários e de integração
pnpm test

# Testes em modo watch
pnpm test:watch

# Testes E2E (requer app compilado)
pnpm test:e2e

# Cobertura de testes
pnpm test:coverage

# Lint + type check
pnpm lint
pnpm typecheck

# Build de produção
pnpm tauri build
```

---

## Estrutura de Configuração

```bash
# Variáveis de ambiente de desenvolvimento (criar manualmente)
cp .env.example .env.local
```

```env
# .env.local
VITE_LOG_LEVEL=debug          # debug | info | warn | error
VITE_DB_PATH=:memory:         # :memory: para testes locais sem dados persistidos
```

---

## Banco de Dados

O banco SQLite é criado automaticamente na primeira execução em:

| Plataforma | Caminho |
|---|---|
| macOS | `~/Library/Application Support/personal-chess-trainer/data.db` |
| Windows | `%APPDATA%\personal-chess-trainer\data.db` |
| Linux | `~/.local/share/personal-chess-trainer/data.db` |

Migrations são aplicadas automaticamente na inicialização do app. Para resetar o banco em desenvolvimento:

```bash
pnpm db:reset    # apaga e recria o banco com seed do banco padrão
pnpm db:seed     # popula exercícios padrão sem apagar dados de usuário
```

---

## Adicionar um Exercício ao Banco Padrão

1. Edite `src/db/seeds/exercicios.json` com o novo exercício no formato:
   ```json
   {
     "id": "uuid-aqui",
     "unidade_id": "uuid-da-unidade",
     "fen_inicial": "rnbqkbnr/...",
     "lances_corretos": [{"san": "Rxf7+"}],
     "temas": ["garfo"],
     "dificuldade": 3
   }
   ```
2. Execute `pnpm db:seed` para aplicar

---

## Rodar um Único Teste

```bash
# Arquivo específico
pnpm vitest run src/shared/lib/sm2.test.ts

# Teste específico por nome
pnpm vitest run --reporter=verbose -t "deve reiniciar fator_facilidade"

# Todos os testes de integração
pnpm vitest run tests/integration/
```

---

## Depuração

```bash
# Abrir DevTools dentro do app Tauri
# macOS: Cmd+Option+I
# Windows/Linux: Ctrl+Shift+I

# Logs do shell Tauri (Rust)
RUST_LOG=debug pnpm tauri dev

# Inspecionar banco de dados
pnpm db:inspect    # abre o banco no sqlite3 CLI
```

---

## Fluxo de Contribuição

```bash
# Criar branch de feature
git checkout -b feat/nome-da-feature

# Antes de commitar (hooks automáticos via Lefthook)
# - ESLint + Prettier nos arquivos alterados
# - tsc --noEmit

# Antes de fazer push (hook automático)
# - vitest run (todos os testes unitários)

# Formato de commit obrigatório (Conventional Commits)
git commit -m "feat(exercicio): adicionar sistema de dicas em 3 níveis"
```
