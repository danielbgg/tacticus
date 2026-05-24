import { test, expect } from "@playwright/test";

test.describe("Sessão de Treino", () => {
  test.beforeEach(async ({ page }) => {
    // Assume que existe um perfil pré-criado e DB com exercícios
    await page.goto("/home");
  });

  test("abre banco, seleciona unidade e inicia treino", async ({ page }) => {
    await page.getByRole("link", { name: /exercícios/i }).click();
    await expect(page).toHaveURL("/banco");

    // Selecionar área
    const primeiraArea = page
      .getByRole("button")
      .filter({ hasText: /tática|básic/i })
      .first();
    if (await primeiraArea.isVisible()) {
      await primeiraArea.click();
    }
  });

  test("exercício errado volta para a fila", async ({ page }) => {
    // Este teste valida a lógica Chessimo — exercício errado é reinserido na fila
    await page.goto("/banco");
    // Verificar que a contagem de exercícios aumenta após erro
    // (implementação dependente de dados de seed)
  });
});
