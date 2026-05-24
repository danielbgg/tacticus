import { describe, it, expect } from "vitest";
import { calcularXp } from "@/features/sessao/domain/calcular-xp";

describe("calcularXp", () => {
  it("acerto sem dica retorna XP base", () => {
    const xp = calcularXp({ acertou: true, dicasUsadas: 0, tempoMs: 5000 });
    expect(xp).toBe(10);
  });

  it("dica nível 1 reduz XP em 20%", () => {
    const semDica = calcularXp({ acertou: true, dicasUsadas: 0, tempoMs: 5000 });
    const comDica1 = calcularXp({ acertou: true, dicasUsadas: 1, tempoMs: 5000 });
    expect(comDica1).toBeLessThan(semDica);
    expect(comDica1).toBe(8);
  });

  it("dica nível 2 reduz XP em 50%", () => {
    const comDica2 = calcularXp({ acertou: true, dicasUsadas: 2, tempoMs: 5000 });
    expect(comDica2).toBe(5);
  });

  it("dica nível 3 (erro) retorna 0 XP", () => {
    const comDica3 = calcularXp({ acertou: true, dicasUsadas: 3, tempoMs: 5000 });
    expect(comDica3).toBe(0);
  });

  it("erro sem dica retorna 0 XP", () => {
    const xp = calcularXp({ acertou: false, dicasUsadas: 0, tempoMs: 3000 });
    expect(xp).toBe(0);
  });

  it("resposta muito rápida (< 3s) dá bônus de velocidade", () => {
    const normal = calcularXp({ acertou: true, dicasUsadas: 0, tempoMs: 5000 });
    const rapido = calcularXp({ acertou: true, dicasUsadas: 0, tempoMs: 2000 });
    expect(rapido).toBeGreaterThan(normal);
  });
});
