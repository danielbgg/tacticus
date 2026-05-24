import type {
  PerfilId,
  ExercicioId,
  SessaoId,
  TentativaId,
  PartidaId,
  UnidadeId,
  ModuloId,
  AreaId,
  ConquistaId,
} from "./branded";

export type NivelJogador = "iniciante" | "intermediario" | "avancado" | "mestre";
export type TipoExercicio = "tatica" | "estrategia" | "tecnica" | "abertura";
export type StatusExercicio = "nao_visto" | "em_progresso" | "dominado";
export type Resultado = "1-0" | "0-1" | "1/2-1/2" | "*";
export type ModoSessao = "treino" | "revisao" | "livre";
export type TemaInterface = "claro" | "escuro" | "madeira";
export type AnimacaoLances = "lenta" | "normal" | "rapida" | "desligada";
export type EstiloTabuleiro = "classico" | "neo" | "madeira" | "marmore" | "azul" | "verde";
export type ConjuntoPecas = "cburnett" | "merida" | "alpha" | "pirouetti" | "fantasy";

export interface ConfiguracoesPerfil {
  perfilId: PerfilId;
  tema: TemaInterface;
  estiloTabuleiro: EstiloTabuleiro;
  conjuntoPecas: ConjuntoPecas;
  animacaoLances: AnimacaoLances;
  somHabilitado: boolean;
  modoDaltonico: boolean;
  idioma: "pt-BR" | "en" | "es";
}

export interface Perfil {
  id: PerfilId;
  nome: string;
  avatar: string;
  nivel: NivelJogador;
  acertosParaDominar: number;
  criadoEm: Date;
  ultimoAcesso: Date;
}

export interface Partida {
  id: PartidaId;
  brancas: string;
  negras: string;
  eloBrancas?: number;
  eloNegras?: number;
  evento?: string;
  ano?: number;
  resultado?: Resultado;
  eco?: string;
  pgn?: string;
}

export interface Exercicio {
  id: ExercicioId;
  unidadeId: UnidadeId;
  partida: Partida;
  fen: string;
  fenInicial: string;
  lancesSolucao: string[];
  fenFinal?: string;
  tipo: TipoExercicio;
  descricao?: string;
  ordem: number;
}

export interface AvaliacaoMotor {
  melhorLance: string;
  centipawns: number | null;
  mate: number | null;
  profundidade: number;
  linha: string[];
}

export interface ProgressoExercicio {
  perfilId: PerfilId;
  exercicioId: ExercicioId;
  status: StatusExercicio;
  acertosConsecutivos: number;
  totalAcertos: number;
  totalTentativas: number;
  fatorFacilidade: number;
  intervaloDias: number;
  proximaRevisao: Date | null;
  ultimaTentativa: Date | null;
}

export interface Tentativa {
  id: TentativaId;
  sessaoId: SessaoId;
  perfilId: PerfilId;
  exercicioId: ExercicioId;
  timestamp: Date;
  acertou: boolean;
  tempoRespostaMs: number;
  dicasUsadas: 0 | 1 | 2 | 3;
}

export interface Sessao {
  id: SessaoId;
  perfilId: PerfilId;
  inicio: Date;
  fim?: Date;
  totalTentativas: number;
  totalAcertos: number;
  modo: ModoSessao;
}

export interface Unidade {
  id: UnidadeId;
  moduloId: ModuloId;
  nome: string;
  descricao?: string;
  ordem: number;
  totalExercicios: number;
}

export interface Modulo {
  id: ModuloId;
  areaId: AreaId;
  nome: string;
  descricao?: string;
  ordem: number;
}

export interface Area {
  id: AreaId;
  nome: string;
  descricao?: string;
  ordem: number;
}

export interface LanceSan {
  san: string;
  comentario?: string;
}

export interface Conquista {
  id: ConquistaId;
  nome: string;
  descricao: string;
  icone: string;
  criterio: { tipo: string; valor: number };
}
