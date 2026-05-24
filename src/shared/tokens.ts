// Design tokens como constantes TypeScript — fonte única da verdade
// As variáveis CSS correspondentes estão em src/index.css

export const CORES_TABULEIRO = {
  classico: { claro: "#f0d9b5", escuro: "#b58863" },
  neo: { claro: "#dee3e6", escuro: "#8ca2ad" },
  madeira: { claro: "#e8c999", escuro: "#9b5e34" },
  marmore: { claro: "#f5f0e8", escuro: "#a8a8a8" },
  azul: { claro: "#dde8f0", escuro: "#4b7399" },
  verde: { claro: "#ffffdd", escuro: "#86a666" },
} as const;

export const CORES_DALTONICO_TABULEIRO = {
  claro: "#ffdd99",
  escuro: "#5577aa",
} as const;

export const TEMAS_CSS: Record<string, Record<string, string>> = {
  claro: {
    "--color-fundo": "#f8f9fa",
    "--color-superficie-primaria": "#ffffff",
    "--color-superficie-secundaria": "#f1f3f5",
    "--color-borda": "#dee2e6",
    "--color-conteudo-primario": "#212529",
    "--color-conteudo-secundario": "#495057",
    "--color-conteudo-terciario": "#868e96",
    "--color-acento": "#2b6cb0",
    "--raio-card": "12px",
  },
  escuro: {
    "--color-fundo": "#0d1117",
    "--color-superficie-primaria": "#161b22",
    "--color-superficie-secundaria": "#21262d",
    "--color-borda": "#30363d",
    "--color-conteudo-primario": "#e6edf3",
    "--color-conteudo-secundario": "#8b949e",
    "--color-conteudo-terciario": "#484f58",
    "--color-acento": "#58a6ff",
    "--raio-card": "12px",
  },
  madeira: {
    "--color-fundo": "#2d1b0e",
    "--color-superficie-primaria": "#3d2510",
    "--color-superficie-secundaria": "#4a2d14",
    "--color-borda": "#6b3e1a",
    "--color-conteudo-primario": "#f5deb3",
    "--color-conteudo-secundario": "#c9956a",
    "--color-conteudo-terciario": "#8b5a2b",
    "--color-acento": "#d4a030",
    "--raio-card": "8px",
  },
} as const;

export const CONJUNTOS_PECAS_LABEL: Record<string, string> = {
  cburnett: "CBurnett (padrão)",
  merida: "Merida",
  alpha: "Alpha",
  pirouetti: "Pirouetti",
  fantasy: "Fantasy",
} as const;
