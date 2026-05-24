# Data Model: Personal Chess Trainer

**Date**: 2026-05-23  
**Phase**: 1 — Entidades, relacionamentos e schema SQLite

---

## Entidades e Relacionamentos

```
Perfil ─────────────────────────────────────────────────────┐
  │                                                          │
  ├── 1:N ──► Sessao                                        │
  │              │                                           │
  │              └── 1:N ──► Tentativa                      │
  │                              │                           │
  ├── 1:N ──► ProgressoExercicio │                          │
  │              │               │                           │
  │              └── N:1 ───────►┘                          │
  │                   Exercicio ◄────────────────────────── │
  │                      │                                  │
  │              N:1 ──► Partida (opcional)                  │
  │                                                          │
  ├── 1:N ──► ConquistaPerfil                               │
  │              └── N:1 ──► Conquista                      │
  │                                                          │
  └── 1:1 ──► ConfiguracoesPerfil                           │
                                                             │
Area ──► Modulo ──► Unidade ──► Exercicio ─────────────────┘
```

---

## Schema SQLite

### perfis

```sql
CREATE TABLE perfis (
  id          TEXT PRIMARY KEY,           -- UUID v4
  nome        TEXT NOT NULL,
  avatar      TEXT NOT NULL,              -- emoji ou path relativo
  nivel       TEXT NOT NULL               -- 'iniciante' | 'intermediario' | 'avancado'
              CHECK(nivel IN ('iniciante','intermediario','avancado')),
  elo_estimado INTEGER,                   -- opcional
  criado_em   TEXT NOT NULL,             -- ISO 8601
  ultimo_acesso TEXT NOT NULL            -- ISO 8601
);

CREATE TABLE configuracoes_perfil (
  perfil_id           TEXT PRIMARY KEY REFERENCES perfis(id) ON DELETE CASCADE,
  estilo_tabuleiro    TEXT NOT NULL DEFAULT 'madeira-clara',
  conjunto_pecas      TEXT NOT NULL DEFAULT 'staunton',
  cor_acento          TEXT NOT NULL DEFAULT '#16a34a',  -- hex
  tema_interface      TEXT NOT NULL DEFAULT 'claro'
                      CHECK(tema_interface IN ('claro','escuro','madeira','alto-contraste','sistema')),
  modo_daltonico      INTEGER NOT NULL DEFAULT 0,       -- boolean
  volume              INTEGER NOT NULL DEFAULT 80,       -- 0-100
  animacao_lances     TEXT NOT NULL DEFAULT 'media'
                      CHECK(animacao_lances IN ('lenta','media','rapida','off')),
  idioma              TEXT NOT NULL DEFAULT 'pt-BR',
  acertos_para_dominar INTEGER NOT NULL DEFAULT 5
                      CHECK(acertos_para_dominar BETWEEN 3 AND 10),
  percentual_avanco   INTEGER NOT NULL DEFAULT 80
                      CHECK(percentual_avanco BETWEEN 50 AND 100),
  max_novos_por_sessao INTEGER NOT NULL DEFAULT 20,
  max_revisoes_por_sessao INTEGER NOT NULL DEFAULT 30,
  tempo_max_exercicio INTEGER,                           -- segundos, NULL = sem limite
  mostrar_dicas       INTEGER NOT NULL DEFAULT 1
);
```

### conteúdo (somente leitura — banco padrão)

```sql
CREATE TABLE areas (
  id    TEXT PRIMARY KEY,
  nome  TEXT NOT NULL,
  ordem INTEGER NOT NULL
);

CREATE TABLE modulos (
  id      TEXT PRIMARY KEY,
  area_id TEXT NOT NULL REFERENCES areas(id),
  nome    TEXT NOT NULL,
  ordem   INTEGER NOT NULL
);

CREATE TABLE unidades (
  id        TEXT PRIMARY KEY,
  modulo_id TEXT NOT NULL REFERENCES modulos(id),
  nome      TEXT NOT NULL,
  ordem     INTEGER NOT NULL
);

CREATE TABLE exercicios (
  id                    TEXT PRIMARY KEY,          -- UUID v4
  unidade_id            TEXT NOT NULL REFERENCES unidades(id),
  partida_id            TEXT REFERENCES partidas(id),  -- NULL se exercício composto
  fen_inicial           TEXT NOT NULL,              -- FEN da posição
  lance_inicial_numero  INTEGER,                    -- nº do lance no jogo original
  lances_corretos       TEXT NOT NULL,              -- JSON: [{san, comentario?}]
  variantes             TEXT NOT NULL DEFAULT '[]', -- JSON: [{lances, comentario}]
  temas                 TEXT NOT NULL DEFAULT '[]', -- JSON: string[]
  dificuldade           INTEGER NOT NULL DEFAULT 3
                        CHECK(dificuldade BETWEEN 1 AND 5),
  comentario_geral      TEXT,
  banco_customizado     INTEGER NOT NULL DEFAULT 0, -- 0=padrão, 1=usuário
  criado_em             TEXT NOT NULL,
  ordem                 INTEGER NOT NULL
);

CREATE INDEX idx_exercicios_unidade     ON exercicios(unidade_id);
CREATE INDEX idx_exercicios_partida     ON exercicios(partida_id);
CREATE INDEX idx_exercicios_banco       ON exercicios(banco_customizado);
CREATE INDEX idx_exercicios_dificuldade ON exercicios(dificuldade);

CREATE TABLE partidas (
  id            TEXT PRIMARY KEY,
  brancas       TEXT NOT NULL,
  pretas        TEXT NOT NULL,
  elo_brancas   INTEGER,
  elo_pretas    INTEGER,
  resultado     TEXT NOT NULL CHECK(resultado IN ('1-0','0-1','1/2-1/2','*')),
  evento        TEXT NOT NULL,
  local         TEXT,
  ano           INTEGER NOT NULL,
  rodada        TEXT,
  eco           TEXT,                               -- ex: "B44"
  abertura      TEXT,                               -- ex: "Sicilian Defense: Taimanov"
  pgn_completo  TEXT,                               -- PGN inteiro (opcional)
  url_referencia TEXT
);

CREATE INDEX idx_partidas_ano      ON partidas(ano);
CREATE INDEX idx_partidas_eco      ON partidas(eco);
CREATE INDEX idx_partidas_brancas  ON partidas(brancas);
CREATE INDEX idx_partidas_pretas   ON partidas(pretas);
```

### progresso (por perfil × exercício)

```sql
CREATE TABLE progresso_exercicio (
  perfil_id               TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  exercicio_id            TEXT NOT NULL REFERENCES exercicios(id),
  acertos_consecutivos    INTEGER NOT NULL DEFAULT 0,
  status                  TEXT NOT NULL DEFAULT 'nao_iniciado'
                          CHECK(status IN ('nao_iniciado','em_progresso','dominado')),
  proximo_review          TEXT,                      -- ISO 8601 date, NULL se não dominado
  fator_facilidade        REAL NOT NULL DEFAULT 2.5, -- SM-2
  ultima_tentativa        TEXT,                      -- ISO 8601 datetime
  PRIMARY KEY (perfil_id, exercicio_id)
);

CREATE INDEX idx_progresso_perfil_status ON progresso_exercicio(perfil_id, status);
CREATE INDEX idx_progresso_perfil_review ON progresso_exercicio(perfil_id, proximo_review);
```

### sessões e tentativas

```sql
CREATE TABLE sessoes (
  id                  TEXT PRIMARY KEY,
  perfil_id           TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  inicio              TEXT NOT NULL,                 -- ISO 8601 datetime
  fim                 TEXT,                          -- NULL enquanto em curso
  total_tentativas    INTEGER NOT NULL DEFAULT 0,
  total_acertos       INTEGER NOT NULL DEFAULT 0,
  xp_ganho            INTEGER NOT NULL DEFAULT 0,
  modo                TEXT NOT NULL
                      CHECK(modo IN ('treinamento','revisao','varredura','livre','cronometrado'))
);

CREATE INDEX idx_sessoes_perfil      ON sessoes(perfil_id);
CREATE INDEX idx_sessoes_perfil_data ON sessoes(perfil_id, inicio);

CREATE TABLE tentativas (
  id                          TEXT PRIMARY KEY,
  sessao_id                   TEXT NOT NULL REFERENCES sessoes(id) ON DELETE CASCADE,
  perfil_id                   TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  exercicio_id                TEXT NOT NULL REFERENCES exercicios(id),
  timestamp                   TEXT NOT NULL,         -- ISO 8601 datetime
  acertou                     INTEGER NOT NULL,       -- boolean
  tempo_resposta_ms           INTEGER NOT NULL,
  dicas_usadas                INTEGER NOT NULL DEFAULT 0 CHECK(dicas_usadas BETWEEN 0 AND 3),
  acertos_consecutivos_apos   INTEGER NOT NULL
);

CREATE INDEX idx_tentativas_perfil    ON tentativas(perfil_id);
CREATE INDEX idx_tentativas_exercicio ON tentativas(exercicio_id);
CREATE INDEX idx_tentativas_timestamp ON tentativas(perfil_id, timestamp);
```

### gamificação

```sql
CREATE TABLE conquistas (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  descricao   TEXT NOT NULL,
  icone       TEXT NOT NULL,              -- emoji
  criterio    TEXT NOT NULL               -- JSON: {tipo, valor}
);

CREATE TABLE conquistas_perfil (
  perfil_id     TEXT NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  conquista_id  TEXT NOT NULL REFERENCES conquistas(id),
  desbloqueado_em TEXT NOT NULL,          -- ISO 8601 datetime
  PRIMARY KEY (perfil_id, conquista_id)
);
```

---

## Tipos TypeScript Correspondentes

```typescript
// src/shared/types/branded.ts
type PerfilId    = string & { readonly _brand: "PerfilId" };
type ExercicioId = string & { readonly _brand: "ExercicioId" };
type SessaoId    = string & { readonly _brand: "SessaoId" };
type TentativaId = string & { readonly _brand: "TentativaId" };
type PartidaId   = string & { readonly _brand: "PartidaId" };
type UnidadeId   = string & { readonly _brand: "UnidadeId" };
type ModuloId    = string & { readonly _brand: "ModuloId" };
type ConquistaId = string & { readonly _brand: "ConquistaId" };

// src/shared/types/domain.ts
type NivelJogador    = "iniciante" | "intermediario" | "avancado";
type StatusExercicio = "nao_iniciado" | "em_progresso" | "dominado";
type Resultado       = "1-0" | "0-1" | "1/2-1/2" | "*";
type ModoSessao      = "treinamento" | "revisao" | "varredura" | "livre" | "cronometrado";
type TemaInterface   = "claro" | "escuro" | "madeira" | "alto-contraste" | "sistema";
type AnimacaoLances  = "lenta" | "media" | "rapida" | "off";

interface Perfil {
  id: PerfilId;
  nome: string;
  avatar: string;
  nivel: NivelJogador;
  eloEstimado?: number;
  criadoEm: Date;
  ultimoAcesso: Date;
}

interface Exercicio {
  id: ExercicioId;
  unidadeId: UnidadeId;
  partidaId?: PartidaId;
  fenInicial: string;
  lanceInicialNumero?: number;
  lancesCorretos: LanceSan[];
  variantes: Variante[];
  temas: string[];
  dificuldade: 1 | 2 | 3 | 4 | 5;
  comentarioGeral?: string;
  bancoCustomizado: boolean;
}

interface LanceSan {
  san: string;
  comentario?: string;
}

interface Variante {
  lances: LanceSan[];
  comentario: string;
}

interface Partida {
  id: PartidaId;
  brancas: string;
  pretas: string;
  eloBrancas?: number;
  eloPretas?: number;
  resultado: Resultado;
  evento: string;
  local?: string;
  ano: number;
  rodada?: string;
  eco?: string;
  abertura?: string;
  pgnCompleto?: string;
  urlReferencia?: string;
}

interface ProgressoExercicio {
  perfilId: PerfilId;
  exercicioId: ExercicioId;
  acertosConsecutivos: number;
  status: StatusExercicio;
  proximoReview?: Date;
  fatorFacilidade: number;   // SM-2, inicial 2.5
  ultimaTentativa?: Date;
}

interface Tentativa {
  id: TentativaId;
  sessaoId: SessaoId;
  perfilId: PerfilId;
  exercicioId: ExercicioId;
  timestamp: Date;
  acertou: boolean;
  tempoRespostaMs: number;
  dicasUsadas: 0 | 1 | 2 | 3;
  acertosConsecutivosApos: number;
}

interface Sessao {
  id: SessaoId;
  perfilId: PerfilId;
  inicio: Date;
  fim?: Date;
  totalTentativas: number;
  totalAcertos: number;
  xpGanho: number;
  modo: ModoSessao;
}
```

---

## Regras de Validação e Invariantes

| Entidade | Invariante |
|---|---|
| `ProgressoExercicio` | `status === 'dominado'` implica `proximoReview !== null` |
| `ProgressoExercicio` | `acertosConsecutivos <= config.acertos_para_dominar` |
| `ProgressoExercicio` | `fatorFacilidade >= 1.3` (SM-2 mínimo) |
| `Tentativa` | `dicasUsadas === 3` implica `acertou === false` no SM-2 (conta como erro) |
| `Sessao` | `fim` só é preenchido quando a sessão é encerrada |
| `Exercicio` | `bancoPadrao === false` permite edição/exclusão; `true` é read-only |
| `Perfil` | Ao menos um perfil deve existir sempre no banco |

---

## Migrações

### 0001_init.sql — schema completo inicial

Cria todas as tabelas acima com índices. Popula `areas`, `modulos`, `unidades`, `exercicios` e `partidas` do banco padrão a partir de um arquivo de seed.

### 0002_add_conquistas.sql

Adiciona tabelas `conquistas` e `conquistas_perfil`. Popula conquistas padrão.

### Política de migrations

- Apenas aditivas na v1 (sem DROP, sem RENAME sem alias)
- Cada migration tem rollback documentado em comentário no cabeçalho
- Schema TypeScript em `src/db/schema.ts` é mantido em sync com as migrations
