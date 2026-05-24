# UI State Contracts

**Date**: 2026-05-23  
**Scope**: Contratos de estado de UI por tela — define o que cada tela precisa carregar, os 4 estados obrigatórios e as transições.

---

## Convenção

Toda tela que carrega dados DEVE implementar os 4 estados:

| Estado | Componente | Comportamento |
|---|---|---|
| `loading` | `<Skeleton>` com dimensões reais | Exibido imediatamente; nunca spinner nu |
| `success` | Conteúdo principal | Transição fade-in 150ms |
| `error` | `<ErrorMessage>` + botão "Tentar novamente" | Mensagem amigável, sem stack trace |
| `empty` | `<EmptyState>` com ilustração + ação | Nunca lista vazia sem contexto |

---

## Tela: Seleção de Perfil (`/`)

### Estado

```typescript
type EstadoSelecaoPerfil =
  | { status: "loading" }
  | { status: "success"; perfis: Perfil[] }
  | { status: "error"; mensagem: string }
  | { status: "empty" }  // nenhum perfil cadastrado
```

### Transições

```
App abre
  → loading (busca perfis no banco)
  → [nenhum perfil] → empty (redireciona para criação)
  → [1 perfil] → sucesso imediato, seleciona automaticamente → Home
  → [2+ perfis] → success (exibe cards de seleção)
  → [erro de banco] → error
```

### Contrato de Componente

```typescript
interface PerfilCardProps {
  perfil: Perfil;
  streak: number;
  nivel: number;           // XP calculado em nível 1–100
  ultimoAcesso: Date;
  onSelect: (id: PerfilId) => void;
}
```

---

## Tela: Home (`/home`)

### Estado

```typescript
interface EstadoHome {
  perfilAtivo: Perfil;
  continuarUnidade?: { modulo: string; unidade: string; progresso: number };
  revisoesPendentesHoje: number;
  progressoGeral: number;         // 0–100%
  pontosFracos: string[];         // temas com pior taxa
  streak: number;
  status: "loading" | "success" | "error";
}
```

### Regras

- `continuarUnidade` é a última unidade com status `em_progresso` para o perfil ativo
- `revisoesPendentesHoje` = `COUNT(*) WHERE proximo_review <= today AND status = 'dominado'`
- Card "Continuar" tem prioridade visual máxima (CTA primário)
- Card "Revisar" só aparece se `revisoesPendentesHoje > 0`

---

## Tela: Exercício (`/treinar/:unidadeId/exercicio`)

### Estado da Sessão em Curso

```typescript
type EstadoExercicio =
  | { fase: "carregando" }
  | { fase: "apresentando"; exercicio: Exercicio; orientacao: "brancas" | "pretas" }
  | { fase: "aguardando-lance" }
  | { fase: "processando-lance"; lance: string }
  | { fase: "acerto"; animacaoCompleta: boolean }
  | { fase: "erro"; lanceErrado: string; lanceCorreto: string }
  | { fase: "sessao-encerrada"; resumo: ResumoSessao }
```

### Fila da Sessão

```typescript
interface FilaSessao {
  exerciciosNovos: ExercicioId[];      // da unidade atual, não iniciados
  exerciciosRepetindo: ExercicioId[];  // errados na sessão atual, voltando
  revisoes: ExercicioId[];             // SM-2 agendados para hoje
  concluidos: ExercicioId[];           // dominados nesta sessão
}
```

### Regras de Fila

- Revisões têm prioridade sobre exercícios novos
- Exercício errado volta para o final de `exerciciosRepetindo` (não para o início)
- Um exercício sai de `exerciciosRepetindo` quando é acertado com `acertosConsecutivos >= N`
- Sessão encerra quando `exerciciosNovos + exerciciosRepetindo + revisoes` está vazio

### Painel de Informações (coluna direita)

```typescript
interface PainelInfoProps {
  area: string;
  modulo: string;
  unidade: string;
  exercicioAtual: number;
  totalExercicios: number;
  progressoUnidade: number;         // 0–100%
  acertosConsecutivos: number;
  dicasDisponiveis: 0 | 1 | 2 | 3;
  partidaOrigem?: Partida;
  onDica: () => void;
  onAnalise: () => void;            // só habilitado após acerto
  onEncerrarSessao: () => void;
}
```

### Feedback Visual

| Evento | Animação | Duração | Som |
|---|---|---|---|
| Lance correto | Seta verde animada + contador incrementa | 300ms | `acerto.mp3` |
| Lance errado | Shake na peça + seta vermelha 2s | 400ms shake + 2000ms seta | `erro.mp3` |
| Exercício dominado | Confete + badge "Dominado ✓" | 800ms | `conquista.mp3` |
| Sessão encerrada | Fade para tela de resumo | 400ms | — |

---

## Tela: Estatísticas (`/estatisticas`)

### Estado

```typescript
interface EstadoEstatisticas {
  status: "loading" | "success" | "error";
  visaoGeral?: {
    dominados: number;
    emProgresso: number;
    naoIniciados: number;
    tempoTotalHoras: number;
    streakAtual: number;
    streakRecorde: number;
  };
  heatmap?: Record<string, number>;   // "YYYY-MM-DD" → tentativas
  pontosFracos?: Array<{ tema: string; taxaAcerto: number }>;
  historicoSessoes?: Sessao[];
}
```

### Regras

- Heatmap exibe últimos 365 dias
- `pontosFracos` lista os 5 temas com `taxaAcerto < 0.6` ordenados crescente
- Histórico de sessões paginado (20 por página), filtro por período e área

---

## Tela: Banco de Exercícios (`/banco`)

### Estado da Lista

```typescript
interface EstadoBancoExercicios {
  status: "loading" | "success" | "error" | "empty";
  exercicios?: ExercicioComProgresso[];
  filtros: {
    area?: string;
    modulo?: string;
    tema?: string;
    jogador?: string;
    eco?: string;
    anoMin?: number;
    anoMax?: number;
    bancoPadrao?: boolean;
  };
  paginacao: { pagina: number; total: number; porPagina: 50 };
}
```

### Estado do Editor

```typescript
type EstadoEditor =
  | { modo: "fechado" }
  | { modo: "novo"; rascunho: Partial<Exercicio> }
  | { modo: "editando"; exercicio: Exercicio; alterado: boolean }
  | { modo: "salvando" }
  | { modo: "erro"; mensagem: string }
```

### Regras

- `bancoPadrao === true` → campos desabilitados, sem botão de excluir
- Importação PGN é assíncrona com barra de progresso; erros são listados por partida
- Exercício recém-importado fica com `bancoPadrao = false`

---

## Tela: Configurações (`/configuracoes`)

### Estado

```typescript
interface EstadoConfiguracoes {
  aba: "aparencia" | "treinamento" | "motor" | "dados" | "sobre";
  configuracoes: ConfiguracoesPerfil;
  alteracoesPendentes: boolean;
  preVisualizacaoTabuleiro: boolean;   // tabuleiro de preview ativo
}
```

### Regras

- Mudanças de aparência são aplicadas em tempo real (pré-visualização ao vivo)
- `alteracoesPendentes = true` mostra botão "Salvar" fixo no rodapé
- Sem auto-save — o usuário confirma explicitamente
- Export de dados: dialog de confirmação → escolha de pasta → progresso → confirmação
