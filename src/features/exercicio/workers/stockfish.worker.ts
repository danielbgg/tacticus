// Web Worker para Stockfish 16 WASM — nunca bloqueia a thread principal

type MensagemEntrada = { tipo: "analisar"; fen: string; profundidade?: number } | { tipo: "parar" };

type MensagemSaida =
  | {
      tipo: "avaliacao";
      fen: string;
      centipawns: number;
      melhorLance: string | null;
      profundidade: number;
    }
  | { tipo: "pronto" }
  | { tipo: "erro"; mensagem: string };

let engine: Worker | null = null;
let fenAtual = "";
let resolveAnalise: ((cp: number, lance: string | null, prof: number) => void) | null = null;

function iniciarEngine() {
  // Carrega Stockfish WASM somente quando necessário
  engine = new Worker(new URL("stockfish/src/stockfish.js", import.meta.url), { type: "classic" });
  engine.postMessage("uci");

  engine.onmessage = (e: MessageEvent<string>) => {
    const linha = e.data;

    if (linha === "uciok") {
      engine?.postMessage("isready");
    }

    if (linha === "readyok") {
      self.postMessage({ tipo: "pronto" } satisfies MensagemSaida);
    }

    if (linha.startsWith("info depth") && resolveAnalise) {
      const matchDepth = /depth (\d+)/.exec(linha);
      const matchCp = /score cp (-?\d+)/.exec(linha);
      const matchMate = /score mate (-?\d+)/.exec(linha);
      const matchLance = /pv ([a-h][1-8][a-h][1-8][qrbn]?)/.exec(linha);

      if (matchDepth && (matchCp || matchMate) && matchLance) {
        const profundidade = parseInt(matchDepth[1] ?? "0", 10);
        const cp = matchCp
          ? parseInt(matchCp[1] ?? "0", 10)
          : parseInt(matchMate?.[1] ?? "0", 10) > 0
            ? 30000
            : -30000;
        resolveAnalise(cp, matchLance[1] ?? null, profundidade);
      }
    }

    if (linha.startsWith("bestmove") && resolveAnalise) {
      const match = /bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/.exec(linha);
      const lance = match?.[1] ?? null;
      resolveAnalise(0, lance, 0);
      resolveAnalise = null;
    }
  };
}

self.onmessage = (e: MessageEvent<MensagemEntrada>) => {
  const msg = e.data;

  if (msg.tipo === "analisar") {
    if (!engine) {
      try {
        iniciarEngine();
      } catch {
        self.postMessage({
          tipo: "erro",
          mensagem: "Falha ao carregar Stockfish WASM",
        } satisfies MensagemSaida);
        return;
      }
    }

    fenAtual = msg.fen;
    const profundidade = msg.profundidade ?? 18;

    resolveAnalise = (cp, lance, prof) => {
      if (prof >= profundidade || lance !== null) {
        self.postMessage({
          tipo: "avaliacao",
          fen: fenAtual,
          centipawns: cp,
          melhorLance: lance,
          profundidade: prof,
        } satisfies MensagemSaida);
      }
    };

    engine?.postMessage(`position fen ${msg.fen}`);
    engine?.postMessage(`go depth ${profundidade}`);
  }

  if (msg.tipo === "parar") {
    engine?.postMessage("stop");
    resolveAnalise = null;
  }
};
