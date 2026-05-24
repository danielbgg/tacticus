import { describe, it, expect } from "vitest";
import { nivelParaCurriculo, validarPerfil } from "@/features/perfil/domain/nivelParaCurriculo";

describe("nivelParaCurriculo", () => {
  it("iniciante → acessa apenas Área 1 (Táticas Básicas)", () => {
    const areas = nivelParaCurriculo("iniciante");
    expect(areas[0]).toBe("taticas-basicas");
    expect(areas.length).toBeGreaterThanOrEqual(1);
  });

  it("intermediario → acessa Áreas 1 e 2", () => {
    const areas = nivelParaCurriculo("intermediario");
    expect(areas).toContain("taticas-basicas");
    expect(areas).toContain("finais");
  });

  it("avancado → acessa todas as Áreas", () => {
    const areas = nivelParaCurriculo("avancado");
    expect(areas.length).toBeGreaterThanOrEqual(4);
  });

  it("mestre → acessa todas as Áreas", () => {
    const areas = nivelParaCurriculo("mestre");
    expect(areas.length).toBe(nivelParaCurriculo("avancado").length);
  });
});

describe("validarPerfil", () => {
  it("nome vazio é inválido", () => {
    const resultado = validarPerfil({
      nome: "",
      nivel: "iniciante",
      avatar: "♙",
      acertosParaDominar: 5,
    });
    expect(resultado.ok).toBe(false);
  });

  it("nome com mais de 30 caracteres é inválido", () => {
    const resultado = validarPerfil({
      nome: "A".repeat(31),
      nivel: "iniciante",
      avatar: "♙",
      acertosParaDominar: 5,
    });
    expect(resultado.ok).toBe(false);
  });

  it("acertosParaDominar fora do intervalo 3–10 é inválido", () => {
    const r1 = validarPerfil({ nome: "X", nivel: "iniciante", avatar: "♙", acertosParaDominar: 2 });
    const r2 = validarPerfil({
      nome: "X",
      nivel: "iniciante",
      avatar: "♙",
      acertosParaDominar: 11,
    });
    expect(r1.ok).toBe(false);
    expect(r2.ok).toBe(false);
  });

  it("perfil válido retorna ok", () => {
    const resultado = validarPerfil({
      nome: "Daniel",
      nivel: "intermediario",
      avatar: "♞",
      acertosParaDominar: 5,
    });
    expect(resultado.ok).toBe(true);
  });
});
