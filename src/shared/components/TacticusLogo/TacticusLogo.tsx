interface TacticusLogoProps {
  className?: string | undefined;
  showText?: boolean | undefined;
  iconHeight?: string | undefined;
}

export function TacticusLogo({
  className = "",
  showText = true,
  iconHeight = "h-8",
}: TacticusLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 100 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={`${iconHeight} w-auto shrink-0`}
      >
        <defs>
          {/* Gradiente dourado para o peão (herói) */}
          <linearGradient id="grad-pawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="55%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
          {/* Gradiente prateado para o rei (derrotado) */}
          <linearGradient id="grad-king" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          {/* Brilho do impacto */}
          <radialGradient id="grad-impact" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ══ PEÃO (herói, dourado, ereto à esquerda) ══ */}
        <g fill="url(#grad-pawn)">
          {/* cabeça — esfera redonda */}
          <circle cx="22" cy="8" r="7.5" />
          {/* pescoço — fino, conecta cabeça ao corpo */}
          <rect x="19.5" y="14" width="5" height="8" />
          {/* corpo — mais largo que o pescoço, forma oval */}
          <ellipse cx="22" cy="28.5" rx="12" ry="10" />
          {/* colarinho / ombro */}
          <rect x="10" y="36" width="24" height="3.5" rx="1.75" />
          {/* base — larga e sólida */}
          <rect x="7" y="39.5" width="30" height="8.5" rx="4.25" />
        </g>

        {/* ══ EXPLOSÃO DE IMPACTO (centro) ══ */}
        {/* Halo de energia */}
        <ellipse cx="48" cy="22" rx="8" ry="8" fill="url(#grad-impact)" opacity="0.6" />
        {/* Linhas de energia irradiando */}
        <g stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <line x1="48" y1="17" x2="50" y2="10" />
          <line x1="52" y1="20" x2="59" y2="16" />
          <line x1="52" y1="26" x2="59" y2="31" />
          <line x1="44" y1="16" x2="42" y2="9" />
          <line x1="43" y1="22" x2="36" y2="19" />
          <line x1="46" y1="30" x2="44" y2="37" />
        </g>
        {/* Ponto central do impacto */}
        <circle cx="48" cy="22" r="3.5" fill="#EF4444" />
        <circle cx="48" cy="22" r="1.5" fill="#FEF08A" />

        {/* ══ REI (derrotado, prateado, tombando 28° para a direita) ══ */}
        <g transform="rotate(28 74 56)" fill="url(#grad-king)">
          {/* cruz — símbolo do rei, no topo */}
          <rect x="72" y="0" width="4" height="13" rx="2" />
          <rect x="67" y="3.5" width="14" height="5" rx="2.5" />
          {/* cabeça */}
          <circle cx="74" cy="17" r="7" />
          {/* pescoço */}
          <rect x="71.5" y="23" width="5" height="7" />
          {/* corpo */}
          <ellipse cx="74" cy="37" rx="12" ry="10" />
          {/* colarinho */}
          <rect x="62" y="45" width="24" height="3.5" rx="1.75" />
          {/* base */}
          <rect x="59" y="48.5" width="30" height="8.5" rx="4.25" />
        </g>
      </svg>

      {showText && (
        <span className="font-black tracking-[0.14em] uppercase text-sm select-none">Tacticus</span>
      )}
    </div>
  );
}
