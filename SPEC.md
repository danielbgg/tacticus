# Personal Chess Trainer — Especificação Funcional

**Versão:** 1.1  
**Data:** 2026-05-23  
**Referência original:** Personal Chess Trainer (Gilberto Milos, 2005) / Chessimo

---

## 1. Visão Geral

Aplicação de treinamento de xadrez baseada no método de repetição progressiva (inspirado nos "Seven Circles" de MDLM), com melhorias modernas de UX, algoritmo de repetição espaçada, anotações, temas e gerenciamento de banco de exercícios.

### 1.1 Objetivo

Permitir que jogadores de qualquer nível melhorem tática, estratégia e finais através de repetição guiada de padrões, com feedback imediato, progressão controlada e estatísticas detalhadas.

---

## 2. Perfis de Usuário

### 2.1 Cadastro Local

O aplicativo suporta **múltiplos perfis locais** no mesmo dispositivo — ideal para uso em família ou por um professor com vários alunos. Não há conta online obrigatória na v1.

```
Perfil {
  id: UUID
  nome: string
  avatar: string          // emoji ou caminho para imagem local
  elo_estimado: number?   // opcional, informado pelo usuário no cadastro
  nivel_inicial: "iniciante" | "intermediario" | "avancado"
  criado_em: timestamp
  ultimo_acesso: timestamp
  configuracoes: ConfiguracoesPerfil   // look & feel + treinamento, por perfil
}
```

### 2.2 Tela de Seleção de Perfil

- Exibida ao abrir o aplicativo quando há mais de um perfil cadastrado
- Cards com avatar, nome, nível atual (XP), streak e data do último acesso
- Botão **"+ Novo Perfil"** sempre visível
- Cada perfil tem seu próprio progresso, histórico e configurações completamente isolados

### 2.3 Nível Inicial e Currículo Adaptado

No cadastro, o usuário informa seu nível estimado. O sistema sugere por onde começar:

| Nível | Módulo sugerido para início |
|---|---|
| Iniciante (< 1000 ELO) | Tática Módulo 1 |
| Intermediário (1000–1600) | Tática Módulo 2 + Finais Módulo 1 |
| Avançado (> 1600) | Tática Módulo 3 + todos os módulos desbloqueados |

O usuário pode ignorar a sugestão e começar de onde quiser.

---

## 3. Método de Treinamento

### 2.1 Método Base — Chessimo Circles

- Um exercício é considerado **dominado** quando o usuário o resolve corretamente N vezes consecutivas (padrão: **5 vezes**, configurável entre 3 e 10)
- Errou? O exercício volta **imediatamente** na fila da sessão atual
- A progressão entre unidades é liberada após dominar um percentual mínimo da unidade atual (padrão: **80%**)

### 2.2 Melhoria: Repetição Espaçada (SR)

- Exercícios dominados entram em **fila de revisão** com intervalos crescentes (1d → 3d → 7d → 14d → 30d → 90d)
- Algoritmo baseado em **SM-2** (mesmo do Anki), ajustado por tempo de resposta:
  - Resposta rápida + correta → intervalo aumenta mais
  - Resposta lenta + correta → intervalo aumenta menos
  - Errou → reinicia o contador de domínio

### 2.3 Modos de Estudo

| Modo | Descrição |
|---|---|
| **Treinamento** | Modo principal — repetição com contagem de acertos |
| **Varredura** | Ver todos os exercícios da unidade uma vez, sem repetição |
| **Revisão** | Apenas exercícios com revisão agendada para hoje |
| **Livre** | Navegar e tentar qualquer exercício sem afetar estatísticas |
| **Cronometrado** | Treinamento com tempo máximo por exercício (configurável) |

---

## 4. Estrutura de Conteúdo

### 3.1 Hierarquia

```
Área
└── Módulo (1..N)
    └── Unidade (1..51)
        └── Exercício (1..M)
            └── Lances (sequência de movimentos corretos)
```

### 3.2 Conteúdo Inicial (espelhando PCT original)

| Área | Módulos | Unidades/Módulo | Exercícios totais |
|---|---|---|---|
| Tática | 6 | 51 | ~4.320 |
| Finais | 3 | 51 | ~1.400 |
| Estratégia | 3 | 51 | ~700 |
| **Total** | **12** | **51** | **~6.420** |

### 3.3 Melhoria: Temas por Exercício

Cada exercício possui uma ou mais **tags de tema**:

**Tática:** garfo, fio, dupla ameaça, mate em 1/2/3/4+, ataque à descoberta, xeque duplo, sacrifício, destruição de defesa, desvio, bloqueio, cravada, raio-X, promoção, armadilha

**Finais:** rei e peão, torres, bispo vs. cavaleiro, dama, finais de peões, oposição, quadrado do peão, regra de Lucena/Philidor

**Estratégia:** estrutura de peões, bispo ruim, cavalo na borda, coluna aberta, 7ª fileira, par de bispos, maioria de peões, iniciativa, espaço

---

## 5. Exercícios

### 4.1 Estrutura de um Exercício

```
Exercício {
  id: UUID
  posicao_inicial: FEN string
  lance_inicial_numero: number?       // nº do lance no jogo original (ex: 24)
  lances_corretos: [{ san, comentario? }]
  variantes: [{ lances, comentario }]
  tema: [string]
  dificuldade: 1..5
  comentario_geral: string?
  area: "tatica" | "final" | "estrategia"
  modulo: number
  unidade: number
  partida_id: UUID?                   // FK → Partida (opcional; exercícios compostos não têm)
}

Partida {
  id: UUID
  brancas: string                     // "Kasparov, Garry"
  pretas: string                      // "Karpov, Anatoly"
  elo_brancas: number?
  elo_pretas: number?
  resultado: "1-0" | "0-1" | "1/2-1/2" | "*"
  evento: string                      // "World Championship"
  local: string?                      // "Moscow"
  ano: number
  rodada: string?                     // "24" ou "5.1"
  eco: string?                        // "B44"
  abertura: string?                   // "Sicilian Defense: Taimanov Variation"
  pgn_completo: string?               // PGN da partida inteira (opcional)
  url_referencia: string?             // link externo (Lichess, Chess.com, etc.)
}
```

### 5.2 Exibição da Proveniência na Interface

Durante e após o exercício, um painel discreto (recolhido por padrão, expansível com um clique) mostra:

```
┌─────────────────────────────────────────────────────┐
│  📖  Kasparov × Karpov                              │
│       World Championship · Moscow · 1985            │
│       Lance 24 · Abertura: Siciliana Taimanov (B44) │
│       Resultado: 1-0                                │
│                                                     │
│  [Ver partida completa ↗]   [Copiar FEN]            │
└─────────────────────────────────────────────────────┘
```

- **Ver partida completa:** abre o PGN embutido num visualizador de partida interno (lances navegáveis), ou redireciona para a URL de referência se não houver PGN armazenado
- **Copiar FEN:** copia a posição para a área de transferência (útil para análise externa)
- Exercícios compostos (criados pelo usuário sem partida de origem) exibem apenas "Exercício personalizado"

### 5.3 Filtros e Busca por Proveniência

Na tela de banco de exercícios, o usuário pode filtrar por:
- Jogador (brancas ou pretas)
- Evento / torneio
- Ano ou faixa de anos
- Código ECO / família de abertura
- Exercícios com partida de origem vs. exercícios compostos

### 5.4 Melhoria: Progressão de Dificuldade na Mesma Posição

O mesmo padrão tático pode aparecer em sequência crescente:
- Exercício A: mate em 1 com o padrão X
- Exercício B (mesma posição, mais peças): mate em 2 usando o padrão X
- Exercício C: mate em 3 com variantes

### 5.5 Melhoria: Variantes com Explicação

Quando o usuário erra, o software mostra:
1. O lance jogado (errado)
2. Por que está errado (comentário, se disponível)
3. O lance correto com explicação
4. A continuação completa animada no tabuleiro

---

## 6. Look & Feel — Personalização Visual

Cada perfil tem suas próprias preferências visuais, salvas independentemente.

### 6.1 Tabuleiro

| Opção | Variantes disponíveis |
|---|---|
| **Estilo do tabuleiro** | Madeira clara, Madeira escura, Mármore, Verde feltro (torneio), Azul gelo, Cinza neutro, Alto contraste (daltônico) |
| **Cor das casas claras** | Seletor de cor livre + paletas predefinidas |
| **Cor das casas escuras** | Seletor de cor livre + paletas predefinidas |
| **Borda do tabuleiro** | Com notação (a–h / 1–8), sem borda, borda minimalista |
| **Coordenadas** | Dentro das casas, fora do tabuleiro, ocultas |

### 6.2 Peças

| Conjunto | Estilo |
|---|---|
| **Staunton Clássico** | Estilo torneio padrão (vetor limpo) |
| **Merida** | Tipografia tradicional de xadrez |
| **Alpha** | Moderno, flat design |
| **Leipzig** | Clássico europeu |
| **Cartoon** | Amigável para iniciantes e crianças |
| **3D Realista** | Renderização com sombra e profundidade |

### 6.3 Tema da Interface

| Tema | Descrição |
|---|---|
| **Claro** | Fundo branco/cinza claro, acentos em verde-esmeralda |
| **Escuro** | Fundo grafite/quase-preto, acentos em verde-neon suave |
| **Madeira** | Tons de bege e marrom, remetendo a uma sala de clube |
| **Alto contraste** | Para acessibilidade — fundo preto, texto branco puro |
| **Sistema** | Segue o tema claro/escuro do sistema operacional |

A cor de acento (botões, progresso, destaques) é customizável livremente dentro de cada tema.

### 6.4 Sons

| Evento | Configuração |
|---|---|
| Lance de peça | Clique mecânico / madeira / silencioso |
| Acerto | Tom suave de sucesso |
| Erro | Tom neutro (não punitivo) |
| Exercício dominado | Fanfarra curta |
| Conquista desbloqueada | Som de conquista |
| Volume geral | 0–100% |

### 6.5 Interface do Tabuleiro em Jogo

- Tabuleiro **redimensionável** (arrastar canto ou slider de tamanho)
- **Rotação:** jogar com brancas ou pretas embaixo
- **Setas** desenhadas pelo usuário (botão direito + arrastar)
- **Destaque de casas** (clique direito simples)
- **Última jogada** destacada automaticamente (cor diferente das setas do usuário)
- **Animação de lances** com velocidade configurável (lenta / média / rápida / instantânea)
- **Modo daltônico** disponível como atalho rápido nas configurações

### 6.6 Dicas Progressivas

Sistema de 3 níveis (cada dica penaliza o peso no SR):
1. **Dica 1:** destaca a peça que deve se mover
2. **Dica 2:** mostra seta do lance correto
3. **Dica 3:** executa o lance (conta como erro no SR)

---

## 7. Motor de Xadrez

### 6.1 Motor Padrão

- Motor embutido: **Stockfish** (WASM para web / binário nativo para desktop)
- Profundidade de análise configurável

### 6.2 Melhoria: Motores Externos

- Suporte a qualquer motor UCI via configuração de caminho do executável
- Configuração de número de linhas (MultiPV), threads e memória de hash

### 6.3 Uso do Motor

- Análise pós-exercício (opcional, não disponível durante o treinamento para não viciar)
- Validação de lances alternativos no modo Finais (onde múltiplos lances podem vencer)
- **Modo de análise livre** separado do treinamento

---

## 8. Banco de Exercícios

### 7.1 Melhoria: Editor de Banco

- Interface para adicionar/editar/remover exercícios
- Importação de posições via FEN ou PGN
- Importação em lote via arquivo PGN (com extração automática de posições-chave)
- Exportação do banco customizado

### 7.2 Melhoria: Bibliotecas Customizadas

- Usuário pode criar suas próprias áreas, módulos e unidades
- Banco padrão + banco do usuário são gerenciados separadamente
- Possibilidade de compartilhar bibliotecas (arquivo de exportação)

---

## 9. Histórico e Estatísticas

### 9.1 O Que É Gravado (por perfil)

Cada tentativa em qualquer exercício é gravada permanentemente no banco local, formando um histórico completo e consultável.

```
tentativa {
  id: UUID
  perfil_id: UUID
  exercicio_id: UUID
  sessao_id: UUID
  timestamp: datetime
  acertou: boolean
  tempo_resposta_ms: number
  dicas_usadas: 0 | 1 | 2 | 3
  modo: "treinamento" | "revisao" | "varredura" | "livre" | "cronometrado"
  acertos_consecutivos_apos: number   // estado após esta tentativa
}

sessao {
  id: UUID
  perfil_id: UUID
  inicio: datetime
  fim: datetime
  total_tentativas: number
  total_acertos: number
  xp_ganho: number
}

progresso_exercicio {
  perfil_id: UUID
  exercicio_id: UUID
  acertos_consecutivos: number
  status: "nao_iniciado" | "em_progresso" | "dominado"
  proximo_review: date?
  fator_facilidade: float   // SM-2
  ultima_tentativa: datetime
}
```

### 9.2 Painel de Estatísticas

**Visão Geral (dashboard)**
- Total dominados / em progresso / não iniciados (por área)
- Exercícios com revisão pendente hoje
- Streak atual e recorde de streak
- XP total e nível atual
- Tempo total estudado (lifetime)

**Atividade**
- Heatmap de atividade dos últimos 12 meses (estilo GitHub)
- Gráfico de exercícios por dia (últimos 30 dias)
- Tempo médio por sessão (últimos 30 dias)

**Desempenho**
- Taxa de acerto geral e por área/módulo
- Evolução do tempo médio de resposta por tema (linha do tempo)
- Gráfico de radar: força relativa por área (Tática / Finais / Estratégia)

**Pontos Fracos**
- Ranking automático dos temas com pior taxa de acerto
- Botão direto "Treinar este tema agora"

**Histórico de Sessões**
- Lista de todas as sessões com data, duração, exercícios e % de acerto
- Filtros por período e área

---

## 10. Sessões de Treinamento

### 9.1 Configuração de Sessão

- Número máximo de exercícios novos por sessão (padrão: 20)
- Número máximo de revisões por sessão (padrão: 30)
- Tempo máximo por sessão (opcional)
- Tempo máximo por exercício (opcional — exercício conta como erro se expirar)

### 9.2 Fluxo de uma Sessão

```
1. Carrega fila: revisões pendentes + exercícios novos da unidade atual
2. Para cada exercício:
   a. Exibe posição
   b. Usuário faz o lance
   c. Correto → anima a resposta do adversário → próximo lance (se houver)
   d. Errado → mostra erro + correção → exercício volta à fila
   e. Exercício completo → atualiza contagem de acertos consecutivos
3. Sessão encerrada → exibe resumo (acertos, erros, tempo, XP ganho)
```

### 9.3 Melhoria: Gamificação Leve

- **XP por exercício dominado** (proporcional à dificuldade)
- **Conquistas desbloqueáveis** (ex: "100 táticas dominadas", "7 dias seguidos", "mate em 1 em < 5s")
- **Nível do usuário** calculado pelo total de XP (sem ranking online — apenas pessoal)

---

## 11. Design de Interface (UX/UI)

### 11.1 Princípios de Design

- **Foco no tabuleiro:** o tabuleiro ocupa o centro visual sempre; controles ficam nas margens sem disputar atenção
- **Feedback imediato e claro:** acertos e erros são comunicados com animação suave + cor + som — nunca com texto vermelho agressivo
- **Zero distrações durante o treino:** modo de exercício oculta menus, notificações e elementos não essenciais
- **Progressão visível:** o usuário vê em todo momento onde está e o quanto avançou

### 11.2 Tela de Início (Home)

Após selecionar o perfil, o usuário vê:

```
┌────────────────────────────────────────────────────────┐
│  Bom dia, Daniel!   🔥 Streak: 12 dias                 │
│                                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐   │
│  │  CONTINUAR           │  │  REVISAR HOJE        │   │
│  │  Tática — Módulo 2   │  │  14 exercícios       │   │
│  │  Unidade 17 · 68%    │  │  pendentes           │   │
│  └──────────────────────┘  └──────────────────────┘   │
│                                                        │
│  Progresso geral ──────────────────── 23% concluído   │
│  [████████░░░░░░░░░░░░░░░░░░░░]                       │
│                                                        │
│  Pontos fracos detectados: Garfo de cavalo · Cravada  │
└────────────────────────────────────────────────────────┘
```

### 11.3 Tela de Exercício

Layout de duas colunas em tela larga; coluna única em tela pequena:

**Coluna esquerda (maior):** tabuleiro centralizado, com coordenadas, indicador de turno e contador de acertos consecutivos discreto no canto

**Coluna direita:** painel de contexto com:
- Área / Módulo / Unidade / Exercício N de M
- Barra de progresso da unidade
- Botão de dica (com indicador do nível restante)
- Botão de analisar com motor (disponível apenas pós-acerto)
- Comentário do exercício (recolhido por padrão, expansível)
- **Origem da partida** (recolhido por padrão): jogadores, evento, ano, ECO, resultado — com link para ver a partida completa

**Feedback ao errar:**
- Peça sacudida levemente (animação CSS)
- Tabuleiro mostra o lance correto em seta vermelha por 2 segundos
- Mensagem discreta: "Quase! Tente novamente."
- O exercício entra de volta na fila silenciosamente

**Feedback ao acertar:**
- Seta verde animada mostra o lance
- Som de acerto
- Contador de acertos consecutivos incrementa com micro-animação
- Ao dominar: tela de celebração breve (confete + "Dominado! ✓") antes de avançar

### 11.4 Navegação

- Barra lateral recolhível com: Início, Treinar, Revisar, Estatísticas, Exercícios, Configurações
- Atalhos de teclado publicados em tooltip nas ações principais:
  - `H` → dica
  - `F` → virar tabuleiro
  - `Enter` → próximo exercício (após acerto)
  - `Esc` → pausar sessão
- Breadcrumb sempre visível: Área › Módulo › Unidade

### 11.5 Tela de Conclusão de Sessão

Exibida ao encerrar uma sessão, com:
- Total de exercícios tentados / acertados de primeira / errados
- XP ganho nesta sessão + animação de barra de XP enchendo
- Conquistas desbloqueadas (se houver)
- Previsão: "Próxima revisão em X horas"
- Botão "Continuar treinando" e "Encerrar"

### 11.6 Acessibilidade

- Suporte a navegação completa por teclado
- Contraste mínimo WCAG AA em todos os temas
- Tamanho de fonte configurável (pequeno / médio / grande)
- Modo daltônico (substitui verde/vermelho por azul/laranja em todo o app)

---

## 12. Configurações

| Configuração | Padrão | Opções |
|---|---|---|
| Acertos para dominar | 5 | 3 – 10 |
| Percentual mínimo para avançar unidade | 80% | 50% – 100% |
| Repetir exercício errado imediatamente | Sim | Sim / Não |
| Mostrar dicas disponíveis | Sim | Sim / Não |
| Tempo máx. por exercício | Sem limite | 10s – 10min |
| Motor de análise | Stockfish embutido | Stockfish / UCI externo |
| Idioma da interface | Português | PT / EN / ES |
| Tema visual | Claro | Claro / Escuro / Sistema |
| Sons | Ativados | Ativado / Desativado |
| Animação de lances | Média | Lenta / Média / Rápida / Off |

---

## 13. Arquitetura Técnica (Sugestões)

### 11.1 Stack Recomendada

| Camada | Tecnologia sugerida |
|---|---|
| Frontend | React + TypeScript |
| Tabuleiro | `react-chessboard` + `chess.js` |
| Motor | Stockfish WASM |
| Persistência local | SQLite (via `better-sqlite3` ou Tauri) |
| Desktop wrapper | Tauri (Rust) — menor bundle que Electron |
| SR Algorithm | Implementação própria SM-2 |

### 13.2 Modelo de Dados Principal

```
perfis
partidas
areas → modulos → unidades → exercicios → partidas (FK opcional)
perfis → progresso_exercicio (1 linha por exercício × perfil)
sessoes → tentativas
conquistas → conquistas_perfil
```

---

## 14. Fora de Escopo (v1)

- Multijogador ou ranking online
- Análise de partidas próprias
- Abertura de repertório
- Sincronização em nuvem
- Mobile nativo (iOS/Android)

---

## 15. Melhorias vs. PCT Original — Resumo

| Limitação do PCT | Solução neste clone |
|---|---|
| Sem setas/destaques no tabuleiro | Setas e highlights nativos |
| Sem variantes com explicação | Árvore de variantes com comentários por lance |
| Motor fixo (Crafty) | Stockfish embutido + suporte a qualquer motor UCI |
| Sem modo varredura | Modo Varredura implementado |
| Sem editor de banco | Editor completo + importação PGN |
| Sem temas nos exercícios | Tags de tema + filtro + relatório de pontos fracos |
| Repetição forçada em 6x | Configurável (3–10x) |
| Finais sem explicação do "porquê" | Comentários por lance + motor valida alternativas |
| Sem estatísticas granulares | Painel completo com heatmap, gráficos, taxa por tema |
| Sem dicas | Sistema de 3 níveis de dica com penalidade no SR |
| Perfil único | Múltiplos perfis locais com histórico isolado por perfil |
| Interface datada (Windows 98) | Design moderno, responsivo, com temas claro/escuro/madeira |
| Personalização visual mínima | 7 estilos de tabuleiro, 6 conjuntos de peças, cor de acento livre |
| Sem histórico detalhado | Toda tentativa gravada — histórico vitalício consultável |
| Fonte da posição era campo de texto livre | Entidade `Partida` com jogadores, evento, ano, ECO, PGN e URL — visualizável dentro do app |
