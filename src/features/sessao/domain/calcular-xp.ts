const XP_BASE = 10;
const BONUS_VELOCIDADE_MS = 3000;

const MULTIPLICADOR_DICA: Record<0 | 1 | 2 | 3, number> = {
  0: 1.0,
  1: 0.8,
  2: 0.5,
  3: 0.0,
};

interface EntradaXp {
  acertou: boolean;
  dicasUsadas: 0 | 1 | 2 | 3;
  tempoMs: number;
}

export function calcularXp({ acertou, dicasUsadas, tempoMs }: EntradaXp): number {
  if (!acertou || dicasUsadas === 3) return 0;

  const multiplicador = MULTIPLICADOR_DICA[dicasUsadas];
  let xp = XP_BASE * multiplicador;

  if (tempoMs < BONUS_VELOCIDADE_MS) {
    xp += 2;
  }

  return Math.round(xp);
}
