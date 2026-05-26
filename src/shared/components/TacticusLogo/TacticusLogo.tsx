interface TacticusLogoProps {
  className?: string | undefined;
  showText?: boolean | undefined;
}

export function TacticusLogo({ className = "", showText = true }: TacticusLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 80 52"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="h-8 w-auto shrink-0"
        fill="currentColor"
      >
        {/* ── PEÃO (herói, esquerda, upright) ── */}
        <g>
          {/* cabeça */}
          <circle cx="18" cy="9" r="7" />
          {/* pescoço + corpo: path único, mais estreito no topo, alarga em baixo */}
          <path d="M11 15 C11 13 13.5 12.5 18 12.5 C22.5 12.5 25 13 25 15 L27 34 L9 34 Z" />
          {/* base */}
          <rect x="6" y="34" width="24" height="8" rx="3" />
        </g>

        {/* ── LINHAS DE IMPACTO (centro) ── */}
        <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" fill="none">
          <line x1="37" y1="13" x2="40" y2="7" />
          <line x1="39" y1="16" x2="45" y2="13" />
          <line x1="38" y1="22" x2="44" y2="26" />
          <line x1="35" y1="12" x2="32" y2="6" />
          <line x1="33" y1="18" x2="27" y2="16" />
        </g>

        {/* ── REI (derrotado, tombando 32° para a direita) ── */}
        <g transform="rotate(32 52 47)" opacity="0.62">
          {/* cruz vertical */}
          <rect x="50" y="1" width="4" height="11" rx="2" />
          {/* cruz horizontal */}
          <rect x="45" y="4" width="14" height="4" rx="2" />
          {/* cabeça */}
          <circle cx="52" cy="15" r="6.5" />
          {/* pescoço + corpo */}
          <path d="M45 21 C45 19.5 48 19 52 19 C56 19 59 19.5 59 21 L61.5 38 L42.5 38 Z" />
          {/* base */}
          <rect x="39" y="38" width="26" height="8" rx="3" />
        </g>
      </svg>

      {showText && (
        <span className="font-black tracking-[0.12em] uppercase text-sm select-none">Tacticus</span>
      )}
    </div>
  );
}
