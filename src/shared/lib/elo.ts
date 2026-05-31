const K = 32;

const RESULTADO_POR_DICAS: Record<0 | 1 | 2 | 3, number> = {
  0: 1.0,
  1: 0.7,
  2: 0.4,
  3: 0.2,
};

export function calcularDeltaElo(
  eloJogador: number,
  ratingPuzzle: number,
  acertou: boolean,
  dicasUsadas: 0 | 1 | 2 | 3,
): number {
  const resultado = acertou ? (RESULTADO_POR_DICAS[dicasUsadas] ?? 1.0) : 0.0;
  const esperado = 1 / (1 + Math.pow(10, (ratingPuzzle - eloJogador) / 400));
  return K * (resultado - esperado);
}
