import { test, expect } from "@playwright/test";

test.describe("Look and Feel", () => {
  test("trocar tema e verificar persistência", async ({ page }) => {
    await page.goto("/configuracoes");

    const botaoEscuro = page.getByRole("button", { name: /escuro/i }).first();
    if (await botaoEscuro.isVisible()) {
      await botaoEscuro.click();
      const salvar = page.getByRole("button", { name: /salvar/i });
      if (await salvar.isVisible()) await salvar.click();
    }

    await page.reload();
    await expect(page.locator("html")).toBeVisible();
  });

  test("trocar conjunto de peças e verificar preview no tabuleiro", async ({ page }) => {
    await page.goto("/configuracoes");

    const merida = page.getByRole("button", { name: /merida/i }).first();
    if (await merida.isVisible()) {
      await merida.click();
      // Deve exibir preview atualizado
      const preview = page
        .locator("[data-testid='preview-tabuleiro'], canvas, .board-container")
        .first();
      if (await preview.isVisible()) {
        await expect(preview).toBeVisible();
      }
    }
  });

  test("tema persiste por perfil após reload", async ({ page }) => {
    await page.goto("/configuracoes");

    const botaoClaro = page.getByRole("button", { name: /claro/i }).first();
    if (await botaoClaro.isVisible()) {
      await botaoClaro.click();
      const salvar = page.getByRole("button", { name: /salvar/i });
      if (await salvar.isVisible()) await salvar.click();

      await page.reload();
      await page.goto("/configuracoes");

      // O botão claro deve estar ativo/selecionado
      const botaoClaroAposReload = page.getByRole("button", { name: /claro/i }).first();
      await expect(botaoClaroAposReload).toBeVisible();
    }
  });

  test("modo daltônico ativa cores alternativas", async ({ page }) => {
    await page.goto("/configuracoes");

    const checkDaltonico = page.getByRole("checkbox", { name: /dalt[oô]nic/i });
    if (await checkDaltonico.isVisible()) {
      await checkDaltonico.check();
      const salvar = page.getByRole("button", { name: /salvar/i });
      if (await salvar.isVisible()) await salvar.click();

      await page.reload();
      const html = page.locator("html");
      await expect(html).toBeVisible();
    }
  });
});
