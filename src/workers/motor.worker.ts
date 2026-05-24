/// <reference lib="webworker" />

// Worker que envolve o motor Stockfish (UCI).
// O motor é carregado como sub-worker a partir de /stockfish.js (public/).
// Protocolo de mensagens: ver contracts/worker-api.md

let sfWorker: Worker | null = null;
let analiseAtiva = false;
let timeoutId: ReturnType<typeof setTimeout> | null = null;
const TIMEOUT_MS = 10_000;

function enviarParaMotor(cmd: string) {
  sfWorker?.postMessage(cmd);
}

function cancelarTimeout() {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function parseScore(parts: string[]): { tipo: "cp" | "mate"; valor: number } {
  const idx = parts.indexOf("score");
  if (idx === -1) return { tipo: "cp", valor: 0 };
  const tipo = (parts[idx + 1] ?? "cp") as "cp" | "mate";
  const valor = parseInt(parts[idx + 2] ?? "0", 10);
  return { tipo, valor };
}

function parseLances(parts: string[]): string[] {
  const pvIdx = parts.indexOf("pv");
  return pvIdx === -1 ? [] : parts.slice(pvIdx + 1);
}

self.onmessage = (e: MessageEvent) => {
  const msg = e.data as { tipo: string; fen?: string; profundidade?: number; multiPV?: number };

  if (msg.tipo === "INICIALIZAR") {
    if (sfWorker) return; // já inicializado
    try {
      sfWorker = new Worker("/stockfish.js");
    } catch {
      self.postMessage({ tipo: "ERRO", mensagem: "Não foi possível carregar o motor Stockfish." });
      return;
    }

    sfWorker.onmessage = (evt: MessageEvent) => {
      const line = evt.data as string;

      if (line === "uciok") {
        enviarParaMotor("isready");
        return;
      }

      if (line === "readyok") {
        self.postMessage({ tipo: "PRONTO" });
        return;
      }

      if (analiseAtiva && line.startsWith("info") && line.includes("depth")) {
        const parts = line.split(" ");
        const depthIdx = parts.indexOf("depth");
        const depth = depthIdx !== -1 ? parseInt(parts[depthIdx + 1] ?? "0", 10) : 0;
        const multipvIdx = parts.indexOf("multipv");
        const multipv = multipvIdx !== -1 ? parseInt(parts[multipvIdx + 1] ?? "1", 10) : 1;
        const score = parseScore(parts);
        const lances = parseLances(parts);
        const nosIdx = parts.indexOf("nodes");
        const nos = nosIdx !== -1 ? parseInt(parts[nosIdx + 1] ?? "0", 10) : 0;
        if (lances.length > 0) {
          self.postMessage({ tipo: "LINHA_ANALISE", depth, multipv, score, lances, nos });
        }
        return;
      }

      if (line.startsWith("bestmove")) {
        cancelarTimeout();
        analiseAtiva = false;
        const parts = line.split(" ");
        const melhorLance = parts[1] ?? "";
        self.postMessage({ tipo: "ANALISE_COMPLETA", melhorLance });
      }
    };

    sfWorker.onerror = (err: ErrorEvent) => {
      self.postMessage({ tipo: "ERRO", mensagem: err.message });
    };

    enviarParaMotor("uci");
    return;
  }

  if (msg.tipo === "ANALISAR") {
    if (!sfWorker) return;
    cancelarTimeout();
    analiseAtiva = true;
    const profundidade = msg.profundidade ?? 18;
    const multiPV = msg.multiPV ?? 3;
    enviarParaMotor(`setoption name MultiPV value ${multiPV}`);
    enviarParaMotor(`position fen ${msg.fen}`);
    enviarParaMotor(`go depth ${profundidade}`);

    timeoutId = setTimeout(() => {
      analiseAtiva = false;
      enviarParaMotor("stop");
      self.postMessage({ tipo: "ANALISE_TIMEOUT" });
    }, TIMEOUT_MS);
    return;
  }

  if (msg.tipo === "PARAR_ANALISE") {
    cancelarTimeout();
    analiseAtiva = false;
    enviarParaMotor("stop");
    return;
  }

  if (msg.tipo === "ENCERRAR") {
    cancelarTimeout();
    analiseAtiva = false;
    enviarParaMotor("quit");
    sfWorker?.terminate();
    sfWorker = null;
  }
};
