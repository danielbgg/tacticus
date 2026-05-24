import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import type { EntradaHeatmap } from "@/db/queries/estatisticas";

interface HeatmapProps {
  dados: EntradaHeatmap[];
  semanas?: number;
  className?: string;
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function intensidade(tentativas: number): string {
  if (tentativas === 0) return "bg-[var(--color-borda)] opacity-40";
  if (tentativas < 5) return "bg-[var(--color-acento)] opacity-40";
  if (tentativas < 10) return "bg-[var(--color-acento)] opacity-70";
  return "bg-[var(--color-acento)]";
}

export function Heatmap({ dados, semanas = 20, className }: HeatmapProps) {
  const mapa = useMemo(() => {
    const m = new Map<string, { tentativas: number; acertos: number }>();
    for (const d of dados) m.set(d.data, { tentativas: d.tentativas, acertos: d.acertos });
    return m;
  }, [dados]);

  const dias = useMemo(() => {
    const lista: { data: string; label: string }[] = [];
    const hoje = new Date();
    const totalDias = semanas * 7;
    for (let i = totalDias - 1; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(d.getDate() - i);
      lista.push({
        data: d.toISOString().split("T")[0]!,
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      });
    }
    return lista;
  }, [semanas]);

  const colunas: { data: string; label: string }[][] = [];
  for (let i = 0; i < dias.length; i += 7) {
    colunas.push(dias.slice(i, i + 7));
  }

  return (
    <div className={cn("overflow-x-auto", className)} aria-label="Heatmap de atividade">
      <div className="flex gap-0.5 min-w-max">
        <div className="flex flex-col gap-0.5 mr-1 justify-between py-0.5">
          {DIAS_SEMANA.map((d) => (
            <span
              key={d}
              className="text-[10px] text-[var(--color-conteudo-terciario)] leading-[10px] h-[10px] flex items-center"
            >
              {d}
            </span>
          ))}
        </div>

        {colunas.map((semana, si) => (
          <div key={si} className="flex flex-col gap-0.5">
            {semana.map((dia) => {
              const entrada = mapa.get(dia.data);
              const tent = entrada?.tentativas ?? 0;
              return (
                <div
                  key={dia.data}
                  className={cn(
                    "h-[10px] w-[10px] rounded-[2px] transition-opacity",
                    intensidade(tent),
                  )}
                  title={
                    tent > 0
                      ? `${dia.label}: ${tent} tentativas, ${entrada?.acertos ?? 0} acertos`
                      : dia.label
                  }
                  aria-label={tent > 0 ? `${tent} tentativas em ${dia.label}` : undefined}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-[var(--color-conteudo-terciario)]">
        <span>Menos</span>
        {[0, 3, 8, 12].map((n) => (
          <div
            key={n}
            className={cn("h-[10px] w-[10px] rounded-[2px]", intensidade(n))}
            aria-hidden="true"
          />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}
