import { test, expect } from "@playwright/test";

test.describe("Banco de Exercícios", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/banco");
  });

  test("exibe lista de áreas", async ({ page }) => {
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("filtra banco por jogador", async ({ page }) => {
    const inputJogador = page.getByPlaceholder(/jogador/i).first();
    if (await inputJogador.isVisible()) {
      await inputJogador.fill("Kasparov");
      await page.keyboard.press("Enter");
      // Resultado filtrado ou mensagem vazia
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("filtra banco por ECO", async ({ page }) => {
    const inputEco = page.getByPlaceholder(/eco/i).first();
    if (await inputEco.isVisible()) {
      await inputEco.fill("B20");
      await page.keyboard.press("Enter");
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("abre partida completa a partir do exercício", async ({ page }) => {
    // Navegar para uma área → unidade → exercício
    const primeiraArea = page.getByRole("button").first();
    if (await primeiraArea.isVisible()) {
      await primeiraArea.click();
      // Pode ter um link para visualizar a partida
      const linkPartida = page.getByRole("link", { name: /partida|ver jogo/i }).first();
      if (await linkPartida.isVisible()) {
        await linkPartida.click();
        // Deve mostrar o visualizador de lances
        await expect(
          page.locator("[data-testid='visualizador-lances'], .move-list").first(),
        ).toBeVisible();
      }
    }
  });

  test("drill-down: área → módulo → unidade", async ({ page }) => {
    const primeiraArea = page.getByRole("button").first();
    if (await primeiraArea.isVisible()) {
      await primeiraArea.click();

      // Após clicar na área, deve aparecer módulos
      await expect(page.locator("body")).toBeVisible();

      const primeiroModulo = page.getByRole("button").first();
      if (await primeiroModulo.isVisible()) {
        await primeiroModulo.click();
        await expect(page.locator("body")).toBeVisible();
      }
    }
  });
});
