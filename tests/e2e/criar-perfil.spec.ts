import { test, expect } from "@playwright/test";

test.describe("Criação de Perfil", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("cria perfil e redireciona para home", async ({ page }) => {
    // Tela de seleção de perfis — deve mostrar EmptyState ou botão de criar
    await expect(page.getByRole("heading", { name: /Personal Chess Trainer/i })).toBeVisible();

    // Clicar em criar perfil
    await page.getByRole("button", { name: /criar.*perfil/i }).click();
    await expect(page).toHaveURL("/perfil/novo");

    // Preencher formulário
    await page.getByLabel(/nome/i).fill("Daniel Teste");
    await page.getByRole("button", { name: /criar perfil/i }).click();

    // Deve redirecionar para home
    await expect(page).toHaveURL("/home");
    await expect(page.getByText("Daniel Teste")).toBeVisible();
  });

  test("não permite nome vazio", async ({ page }) => {
    await page.getByRole("button", { name: /criar.*perfil/i }).click();
    await page.getByRole("button", { name: /criar perfil/i }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });
});
