import { lazy } from "react";
import { createRouter, createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { AppLayout } from "./layouts/AppLayout";

const rootRoute = createRootRoute({
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazy(() =>
    import("../features/perfil/pages/SelecaoPerfil").then((m) => ({ default: m.SelecaoPerfil })),
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  component: lazy(() =>
    import("../features/home/pages/HomePage").then((m) => ({ default: m.HomePage })),
  ),
});

const treinarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/treinar/$unidadeId",
  component: lazy(() =>
    import("../features/exercicio/pages/TreinoPage").then((m) => ({ default: m.TreinoPage })),
  ),
});

const revisaoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/revisao",
  component: lazy(() =>
    import("../features/exercicio/pages/RevisaoPage").then((m) => ({ default: m.RevisaoPage })),
  ),
});

const estatisticasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/estatisticas",
  component: lazy(() =>
    import("../features/estatisticas/pages/EstatisticasPage").then((m) => ({
      default: m.EstatisticasPage,
    })),
  ),
});

const circulosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/circulos",
  component: lazy(() =>
    import("../features/banco/pages/CirculosPage").then((m) => ({ default: m.CirculosPage })),
  ),
});

const tematicoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tematico",
  component: lazy(() =>
    import("../features/banco/pages/TematicoPage").then((m) => ({ default: m.TematicoPage })),
  ),
});

const configuracoesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/configuracoes",
  component: lazy(() =>
    import("../features/configuracoes/pages/ConfiguracoesPage").then((m) => ({
      default: m.ConfiguracoesPage,
    })),
  ),
});

const perfilNovoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/perfil/novo",
  component: lazy(() =>
    import("../features/perfil/pages/CriarPerfil").then((m) => ({ default: m.CriarPerfil })),
  ),
});

const refazerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/refazer",
  component: lazy(() =>
    import("../features/exercicio/pages/RefazerErrosPage").then((m) => ({
      default: m.RefazerErrosPage,
    })),
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  homeRoute,
  treinarRoute,
  revisaoRoute,
  estatisticasRoute,
  circulosRoute,
  tematicoRoute,
  configuracoesRoute,
  perfilNovoRoute,
  refazerRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
