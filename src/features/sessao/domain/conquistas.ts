import type { ProgressoExercicio } from "@/shared/types/domain";

interface ConquistaDesbloqueada {
  id: string;
  nome: string;
  icone: string;
}

interface EntradaAvaliacao {
  progresso: ProgressoExercicio[];
  totalSessoes: number;
  totalTentativas: number;
  streakDias?: number;
}

const CRITERIOS: {
  id: string;
  nome: string;
  icone: string;
  avaliar: (entrada: EntradaAvaliacao) => boolean;
}[] = [
  {
    id: "c001",
    nome: "Primeiro Passo",
    icone: "🎯",
    avaliar: ({ totalSessoes }) => totalSessoes >= 1,
  },
  {
    id: "c002",
    nome: "Semana Dedicada",
    icone: "🔥",
    avaliar: ({ streakDias }) => (streakDias ?? 0) >= 7,
  },
  {
    id: "c003",
    nome: "Centenário Tático",
    icone: "♟",
    avaliar: ({ progresso }) => progresso.filter((p) => p.status === "dominado").length >= 100,
  },
  {
    id: "c004",
    nome: "Mestre dos Finais",
    icone: "♔",
    avaliar: ({ progresso }) => progresso.filter((p) => p.status === "dominado").length >= 50,
  },
  {
    id: "c005",
    nome: "Estrategista",
    icone: "⚔",
    avaliar: ({ progresso }) => progresso.filter((p) => p.status === "dominado").length >= 50,
  },
  {
    id: "c007",
    nome: "Maratonista",
    icone: "🏅",
    avaliar: ({ streakDias }) => (streakDias ?? 0) >= 30,
  },
  {
    id: "c008",
    nome: "Mil Exercícios",
    icone: "💎",
    avaliar: ({ totalTentativas }) => totalTentativas >= 1000,
  },
];

export function avaliarConquistas(entrada: EntradaAvaliacao): ConquistaDesbloqueada[] {
  return CRITERIOS.filter((c) => c.avaliar(entrada)).map((c) => ({
    id: c.id,
    nome: c.nome,
    icone: c.icone,
  }));
}
