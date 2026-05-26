// Worker do motor Stockfish — arquivo em public/ para ser servido sem transformação pelo Vite.
// importScripts só funciona em classic workers; Vite converte arquivos .ts para ESM em dev,
// quebrando importScripts. Manter aqui garante contexto classic worker em dev e produção.

importScripts("/stockfish.js");

var engine = null;
var analiseAtiva = false;
var analisePendente = null; // { fen, profundidade, multiPV } — aguardando bestmove anterior
var currentFen = "";         // FEN que está sendo (ou foi) analisado — incluído em cada mensagem
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

// Inicia análise imediatamente (chamador garante que não há análise ativa).
function executarAnalise(fen, profundidade, multiPV) {
  currentFen = fen;
  analiseAtiva = true;
  analisePendente = null;
  enviarParaMotor("setoption name MultiPV value " + multiPV);
  enviarParaMotor("position fen " + fen);
  enviarParaMotor("go depth " + profundidade);
  timeoutId = setTimeout(function () {
    cancelarTimeout();
    analiseAtiva = false;
    enviarParaMotor("stop");
    self.postMessage({ tipo: "ANALISE_TIMEOUT", fen: currentFen });
  }, TIMEOUT_MS);
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
      // Inclui o FEN analisado para que o cliente possa filtrar mensagens obsoletas
      self.postMessage({ tipo: "LINHA_ANALISE", fen: currentFen, depth: depth, multipv: multipv, score: score, lances: lances, nos: nos });
      return;
    }

    if (line.indexOf("bestmove") === 0) {
      cancelarTimeout();
      var parts2 = line.split(" ");
      var melhorLance = parts2[1] || "";
      var fenFinalizado = currentFen;

      if (analisePendente) {
        // O stop foi solicitado para dar lugar a nova análise — não notifica ANALISE_COMPLETA
        var p = analisePendente;
        executarAnalise(p.fen, p.profundidade, p.multiPV);
      } else {
        analiseAtiva = false;
        self.postMessage({ tipo: "ANALISE_COMPLETA", fen: fenFinalizado, melhorLance: melhorLance });
      }
    }
  };

  engine.onerror = function () {
    self.postMessage({ tipo: "ERRO" });
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
    var fen = msg.fen;
    var profundidade = msg.profundidade || 18;
    var multiPV = msg.multiPV || 3;

    if (analiseAtiva) {
      // Para a análise atual e enfileira a nova — iniciada ao receber bestmove
      cancelarTimeout();
      analiseAtiva = false; // ignora info lines da análise interrompida
      analisePendente = { fen: fen, profundidade: profundidade, multiPV: multiPV };
      enviarParaMotor("stop");
    } else {
      executarAnalise(fen, profundidade, multiPV);
    }
    return;
  }

  if (msg.tipo === "PARAR_ANALISE") {
    cancelarTimeout();
    analiseAtiva = false;
    analisePendente = null;
    enviarParaMotor("stop");
    return;
  }

  if (msg.tipo === "ENCERRAR") {
    cancelarTimeout();
    analiseAtiva = false;
    analisePendente = null;
    enviarParaMotor("quit");
    engine = null;
  }
};
