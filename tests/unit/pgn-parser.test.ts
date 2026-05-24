import { describe, it, expect } from "vitest";
import { parsearPgn, extrairPosicoes } from "@/shared/lib/pgn-parser";

const PGN_VALIDO = `[Event "World Championship"]
[White "Kasparov, G"]
[Black "Karpov, A"]
[Result "1-0"]
[ECO "B44"]
[WhiteElo "2850"]
[BlackElo "2720"]
[Date "1985.11.09"]

1. e4 e5 2. Nf3 Nc6 3. d4 {O gambito central} exd4 4. Nxd4 1-0`;

const PGN_TACTICO = `[Event "Test"]
[White "Fischer"]
[Black "Spassky"]
[Result "1-0"]

1. e4 e5 {[%tac]} 2. Nf3 Nc6 1-0`;

const PGN_MALFORMADO = `Isso não é um PGN válido`;

describe("parsearPgn", () => {
  it("extrai headers corretamente", () => {
    const r = parsearPgn(PGN_VALIDO);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.headers["Event"]).toBe("World Championship");
      expect(r.value.headers["White"]).toBe("Kasparov, G");
      expect(r.value.headers["ECO"]).toBe("B44");
    }
  });

  it("extrai lances corretamente", () => {
    const r = parsearPgn(PGN_VALIDO);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.lances.length).toBeGreaterThan(0);
      expect(r.value.lances[0]?.san).toBe("e4");
    }
  });

  it("preserva comentários nos lances", () => {
    const r = parsearPgn(PGN_VALIDO);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const lancesComComentario = r.value.lances.filter((l) => l.comentario);
      expect(lancesComComentario.length).toBeGreaterThan(0);
    }
  });

  it("detecta anotação tática [%tac]", () => {
    const r = parsearPgn(PGN_TACTICO);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const posicoesTaticas = r.value.lances.filter((l) => l.anotacaoTatica);
      expect(posicoesTaticas.length).toBeGreaterThan(0);
    }
  });

  it("retorna erro para PGN malformado (sem headers)", () => {
    const r = parsearPgn(PGN_MALFORMADO);
    expect(r.ok).toBe(false);
  });
});

describe("extrairPosicoes", () => {
  it("extrai posição com anotação tática", () => {
    const parsed = parsearPgn(PGN_TACTICO);
    if (!parsed.ok) throw new Error("falhou ao parsear");
    const posicoes = extrairPosicoes(parsed.value);
    expect(posicoes.length).toBeGreaterThan(0);
  });
});
