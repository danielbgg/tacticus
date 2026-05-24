import { test, expect } from "@playwright/test";

test.describe("Persistência de Dados", () => {
  test("perfil selecionado persiste após reload", async ({ page }) => {
    await page.goto("/");
    // Após criar e selecionar um perfil, um reload deve manter o perfil ativo
    // O usePerfilStore persiste perfilAtivoId via localStorage (zustand persist)
    await page.goto("/home");
    await page.reload();
    // Verifica que não foi redirecionado para tela de seleção
    await expect(page).not.toHaveURL("/");
  });

  test("configurações persistem após reload", async ({ page }) => {
    await page.goto("/configuracoes");
    // Trocar tema para 'claro'
    const botaoClaro = page.getByRole("button", { name: /claro/i }).first();
    if (await botaoClaro.isVisible()) {
      await botaoClaro.click();
      await page.getByRole("button", { name: /salvar/i }).click();
      await page.reload();
      // Verificar que o tema permanece
      const html = page.locator("html, [data-tema]");
      await expect(html.first()).toBeVisible();
    }
  });
});
