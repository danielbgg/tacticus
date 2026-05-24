import type { NivelJogador } from "@/shared/types/domain";
import type { Result } from "@/shared/lib/result";
import { ok, err } from "@/shared/lib/result";

type AreaSlug = "taticas-basicas" | "finais" | "medio-jogo" | "aberturas";

const CURRICULO_POR_NIVEL: Record<NivelJogador, AreaSlug[]> = {
  iniciante: ["taticas-basicas"],
  intermediario: ["taticas-basicas", "finais"],
  avancado: ["taticas-basicas", "finais", "medio-jogo", "aberturas"],
  mestre: ["taticas-basicas", "finais", "medio-jogo", "aberturas"],
};

export function nivelParaCurriculo(nivel: NivelJogador): AreaSlug[] {
  return CURRICULO_POR_NIVEL[nivel];
}

interface ValidarPerfilInput {
  nome: string;
  nivel: NivelJogador;
  avatar: string;
  acertosParaDominar: number;
}

export function validarPerfil(input: ValidarPerfilInput): Result<ValidarPerfilInput, string> {
  if (!input.nome.trim()) return err("O nome não pode estar vazio");
  if (input.nome.length > 30) return err("O nome não pode ter mais de 30 caracteres");
  if (input.acertosParaDominar < 3 || input.acertosParaDominar > 10) {
    return err("Acertos para dominar deve estar entre 3 e 10");
  }
  return ok(input);
}
