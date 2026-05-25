// Worker do motor Stockfish — arquivo em public/ para ser servido sem transformação pelo Vite.
// importScripts só funciona em classic workers; Vite converte arquivos .ts para ESM em dev,
// quebrando importScripts. Manter aqui garante contexto classic worker em dev e produção.

importScripts("/stockfish.js");

var engine = null;
var analiseAtiva = false;
var timeoutId = null;
var TIMEOUT_MS = 10000;

function enviarParaMotor(cmd) {
  if (engine) engine.postMessage(cmd);
}

function cancelarTimeout() {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function parseScore(parts) {
  var idx = parts.indexOf("score");
  if (idx === -1) return { tipo: "cp", valor: 0 };
  var tipo = parts[idx + 1] || "cp";
  var valor = parseInt(parts[idx + 2] || "0", 10);
  return { tipo: tipo, valor: valor };
}

function parseLances(parts) {
  var pvIdx = parts.indexOf("pv");
  return pvIdx === -1 ? [] : parts.slice(pvIdx + 1);
}

function iniciarEngine() {
  engine = STOCKFISH();

  engine.onmessage = function (line) {
    if (line === "uciok") {
      enviarParaMotor("isready");
      return;
    }

    if (line === "readyok") {
      self.postMessage({ tipo: "PRONTO" });
      return;
    }

    if (analiseAtiva && line.indexOf("info") === 0 && line.indexOf("depth") !== -1) {
      var parts = line.split(" ");
      var depthIdx = parts.indexOf("depth");
      var depth = depthIdx !== -1 ? parseInt(parts[depthIdx + 1] || "0", 10) : 0;
      var multipvIdx = parts.indexOf("multipv");
      var multipv = multipvIdx !== -1 ? parseInt(parts[multipvIdx + 1] || "1", 10) : 1;
      var score = parseScore(parts);
      var lances = parseLances(parts);
      var nosIdx = parts.indexOf("nodes");
      var nos = nosIdx !== -1 ? parseInt(parts[nosIdx + 1] || "0", 10) : 0;
      if (lances.length > 0) {
        self.postMessage({ tipo: "LINHA_ANALISE", depth: depth, multipv: multipv, score: score, lances: lances, nos: nos });
      }
      return;
    }

    if (line.indexOf("bestmove") === 0) {
      cancelarTimeout();
      analiseAtiva = false;
      var parts = line.split(" ");
      var melhorLance = parts[1] || "";
      self.postMessage({ tipo: "ANALISE_COMPLETA", melhorLance: melhorLance });
    }
  };

  enviarParaMotor("uci");
}

self.onmessage = function (e) {
  var msg = e.data;

  if (msg.tipo === "INICIALIZAR") {
    if (engine) return;
    try {
      iniciarEngine();
    } catch (err) {
      self.postMessage({ tipo: "ERRO", mensagem: "Não foi possível carregar o motor Stockfish." });
    }
    return;
  }

  if (msg.tipo === "ANALISAR") {
    if (!engine) return;
    cancelarTimeout();
    analiseAtiva = true;
    var profundidade = msg.profundidade || 18;
    var multiPV = msg.multiPV || 3;
    enviarParaMotor("setoption name MultiPV value " + multiPV);
    enviarParaMotor("position fen " + msg.fen);
    enviarParaMotor("go depth " + profundidade);
    timeoutId = setTimeout(function () {
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
    engine = null;
  }
};
