interface PainelNotacaoProps {
  lances: string[];
}

export function PainelNotacao({ lances }: PainelNotacaoProps) {
  if (lances.length === 0) return null;

  // Agrupa em pares: [brancas, negras]
  const pares: Array<{ numero: number; brancas: string; negras?: string | undefined }> = [];
  for (let i = 0; i < lances.length; i += 2) {
    const negras = lances[i + 1];
    pares.push({
      numero: Math.floor(i / 2) + 1,
      brancas: lances[i] ?? "",
      ...(negras !== undefined ? { negras } : {}),
    });
  }

  return (
    <div className="rounded-xl border border-[var(--color-borda)] bg-[var(--color-superficie)] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-conteudo-terciario)] mb-2">
        Notação
      </p>
      <div className="font-mono text-sm space-y-0.5">
        {pares.map((par) => (
          <div key={par.numero} className="flex items-center gap-2">
            <span className="w-5 text-right text-[var(--color-conteudo-terciario)] select-none shrink-0">
              {par.numero}.
            </span>
            <span className="w-16 font-medium text-[var(--color-conteudo-primario)]">
              {par.brancas}
            </span>
            {par.negras && (
              <span className="w-16 text-[var(--color-conteudo-secundario)]">{par.negras}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
