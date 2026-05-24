# Worker API Contract: Stockfish

**Date**: 2026-05-23  
**Scope**: API de mensagens entre a thread principal e o Web Worker do Stockfish

---

## Princípios

- Todo acesso ao motor é via `postMessage` — nunca síncrono
- O worker é carregado **sob demanda** (primeira vez que o usuário solicita análise)
- Durante o treinamento ativo, o worker NÃO está disponível — só é instanciado na tela de análise pós-exercício
- Timeout de 5 segundos em toda análise — após isso, o worker envia `AnaliseTimeout`

---

## Mensagens: Thread Principal → Worker

```typescript
type MensagemParaWorker =
  | { tipo: "INICIALIZAR" }
  | { tipo: "ANALISAR"; fen: string; profundidade: number; multiPV: number }
  | { tipo: "PARAR_ANALISE" }
  | { tipo: "ENCERRAR" }
```

## Mensagens: Worker → Thread Principal

```typescript
type MensagemDoWorker =
  | { tipo: "PRONTO" }
  | {
      tipo: "LINHA_ANALISE";
      depth: number;
      multipv: number;
      score: { tipo: "cp" | "mate"; valor: number };
      lances: string[];    // UCI notation
      nos: number;
    }
  | { tipo: "ANALISE_COMPLETA"; melhorLance: string }
  | { tipo: "ANALISE_TIMEOUT" }
  | { tipo: "ERRO"; mensagem: string }
```

---

## Ciclo de Vida

```
1. Usuário clica "Analisar com motor"
2. Thread principal: instancia worker (se ainda não existe) → postMessage INICIALIZAR
3. Worker → PRONTO
4. Thread principal → postMessage ANALISAR { fen, profundidade: 18, multiPV: 3 }
5. Worker → stream de LINHA_ANALISE (uma por depth atingido)
6. Worker → ANALISE_COMPLETA { melhorLance }
   OU após 5s sem conclusão → ANALISE_TIMEOUT
7. Usuário navega para outra tela
8. Thread principal → postMessage PARAR_ANALISE → postMessage ENCERRAR
```

---

## Hook de Integração

```typescript
// src/features/exercicio/hooks/useMotor.ts
interface UseMotorReturn {
  status: "inativo" | "carregando" | "pronto" | "analisando" | "erro";
  linhas: LinhaAnalise[];
  melhorLance?: string;
  analisar: (fen: string) => void;
  parar: () => void;
}
```
