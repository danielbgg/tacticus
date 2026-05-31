/* Ícones SVG coloridos para a barra de navegação lateral — estilo Chess.com */

interface IconProps {
  size?: number;
  active?: boolean;
}

export function IconHome({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 9.5L10 3l7 6.5V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        fill={active ? "#5b8c3e" : "#7ab55e"}
        stroke={active ? "#3d6128" : "#5b8c3e"}
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <rect x="7.5" y="12" width="5" height="6" rx="0.5" fill={active ? "#3d6128" : "#4a7a30"} />
    </svg>
  );
}

export function IconCirculos({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {/* Rei estilizado */}
      <circle cx="10" cy="10" r="8" fill={active ? "#2d6ea8" : "#4a8dc2"} />
      <circle cx="10" cy="10" r="5.5" fill={active ? "#1e5080" : "#2d6ea8"} />
      <path d="M10 5v10M5 10h10" stroke="#a8d4f5" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="10" r="1.5" fill="#c9e8ff" />
    </svg>
  );
}

export function IconTematico({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {/* Cavalo simplificado */}
      <path
        d="M7 16c0 0 .5-2 1-3-1 0-2.5-.5-3-2 .5 0 1.5.5 2 0C6.5 9 6 7 7 6c.5 1 1 1.5 2 1.5 0-1 .5-3 2-3.5-.5 1-.5 2 0 2.5 1-.5 2-.5 2.5 0-.5 0-1 .5-1 1 .5.5 1 2 0 3.5-.5.5-1.5.5-2 .5L10 16H7z"
        fill={active ? "#c0620e" : "#e07c2a"}
        stroke={active ? "#8a4008" : "#b05820"}
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <ellipse cx="9" cy="16.5" rx="2" ry="0.7" fill={active ? "#8a4008" : "#b05820"} />
    </svg>
  );
}

export function IconRevisao({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill={active ? "#7047b8" : "#9060d0"} />
      <path
        d="M10 6v4l2.5 2.5"
        stroke="#e0d0ff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* seta de revisão */}
      <path
        d="M14.5 4.5 A6 6 0 0 1 16 10"
        stroke="#c0a0ff"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M14 3l1 2-2 .5" fill="#c0a0ff" />
    </svg>
  );
}

export function IconEstatisticas({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="12" width="3.5" height="6" rx="0.8" fill={active ? "#1a8f70" : "#28b08a"} />
      <rect x="7.5" y="8" width="3.5" height="10" rx="0.8" fill={active ? "#1a7a5e" : "#228870"} />
      <rect x="13" y="4" width="3.5" height="14" rx="0.8" fill={active ? "#156050" : "#1a8060"} />
      <path d="M3.75 12L9.25 8L14.75 4" stroke="#80e8c8" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function IconConfiguracoes({ size = 20, active }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.8" fill={active ? "#5a5a6e" : "#7878a0"} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 10 + 4.5 * Math.cos(rad);
        const y1 = 10 + 4.5 * Math.sin(rad);
        const x2 = 10 + 7 * Math.cos(rad);
        const y2 = 10 + 7 * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={active ? "#7878a0" : "#9898b8"}
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

export function IconTrocarPerfil({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="7" r="3.5" fill="#6868a0" />
      <path
        d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6"
        stroke="#6868a0"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 12l2 2-2 2"
        stroke="#9898b8"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
