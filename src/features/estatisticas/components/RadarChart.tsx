interface Dimensao {
  label: string;
  valor: number; // 0–100
}

interface RadarChartProps {
  dimensoes: Dimensao[];
  size?: number;
  cor?: string;
}

export function RadarChart({
  dimensoes,
  size = 200,
  cor = "var(--color-acento)",
}: RadarChartProps) {
  if (dimensoes.length < 3) return null;

  const centro = size / 2;
  const raio = size * 0.38;
  const n = dimensoes.length;
  const aneis = [0.25, 0.5, 0.75, 1];

  function ponto(indice: number, fator: number): [number, number] {
    const angulo = (Math.PI * 2 * indice) / n - Math.PI / 2;
    return [centro + Math.cos(angulo) * raio * fator, centro + Math.sin(angulo) * raio * fator];
  }

  function poligonoPath(fatores: number[]): string {
    return (
      fatores
        .map((f, i) => {
          const [x, y] = ponto(i, f);
          return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ") + " Z"
    );
  }

  const valoresFatores = dimensoes.map((d) => Math.max(0, Math.min(1, d.valor / 100)));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label="Gráfico radar de desempenho"
      role="img"
    >
      {/* Anéis de referência */}
      {aneis.map((f) => (
        <polygon
          key={f}
          points={Array.from({ length: n }, (_, i) => ponto(i, f).join(",")).join(" ")}
          fill="none"
          stroke="var(--color-borda)"
          strokeWidth="1"
        />
      ))}

      {/* Eixos */}
      {dimensoes.map((_, i) => {
        const [x, y] = ponto(i, 1);
        return (
          <line
            key={i}
            x1={centro}
            y1={centro}
            x2={x.toFixed(2)}
            y2={y.toFixed(2)}
            stroke="var(--color-borda)"
            strokeWidth="1"
          />
        );
      })}

      {/* Área dos dados */}
      <path
        d={poligonoPath(valoresFatores)}
        fill={cor}
        fillOpacity="0.2"
        stroke={cor}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Pontos nos vértices */}
      {valoresFatores.map((f, i) => {
        const [x, y] = ponto(i, f);
        return <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r="3" fill={cor} />;
      })}

      {/* Labels */}
      {dimensoes.map((d, i) => {
        const [x, y] = ponto(i, 1.22);
        const ancora = x < centro - 2 ? "end" : x > centro + 2 ? "start" : "middle";
        return (
          <text
            key={i}
            x={x.toFixed(2)}
            y={y.toFixed(2)}
            textAnchor={ancora}
            dominantBaseline="middle"
            fontSize="10"
            fill="var(--color-conteudo-secundario)"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}
