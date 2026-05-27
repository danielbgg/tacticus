import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { TacticusLogo } from "@/shared/components/TacticusLogo/TacticusLogo";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/home", label: "Início", icon: "⊕" },
  { path: "/circulos", label: "Círculos de Treino", icon: "♟" },
  { path: "/tematico", label: "Treino Temático", icon: "♞" },
  { path: "/revisao", label: "Revisar", icon: "🔄" },
  { path: "/estatisticas", label: "Estatísticas", icon: "📊" },
  { path: "/configuracoes", label: "Configurações", icon: "⚙" },
] as const;

export function AppLayout({ children }: AppLayoutProps) {
  const location = useRouterState({ select: (s) => s.location });
  const configuracoes = usePerfilStore((s) => s.configuracoes);
  const tema = configuracoes?.tema ?? "escuro";
  const rotasSemNav = ["/", "/perfil/novo"];

  const exibirNav = !rotasSemNav.includes(location.pathname);

  return (
    <div
      data-tema={tema}
      className="flex h-screen bg-[var(--color-fundo)] text-[var(--color-conteudo-primario)]"
    >
      {exibirNav && (
        <nav
          aria-label="Navegação principal"
          className="flex flex-col w-52 border-r border-[var(--color-borda)] bg-[var(--color-superficie-secundaria)] shrink-0"
        >
          <div className="px-3 py-3.5 border-b border-[var(--color-borda)]">
            <TacticusLogo className="text-[var(--color-conteudo-primario)]" />
          </div>
          <ul className="flex flex-col gap-1 p-2 mt-2" role="list">
            {navItems.map((item) => (
              <li key={item.path} role="listitem">
                <Link
                  to={item.path}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--color-acento)]/10 hover:text-[var(--color-acento)] transition-colors"
                  activeProps={{
                    className:
                      "bg-[var(--color-acento)]/15 text-[var(--color-acento)] font-semibold",
                  }}
                >
                  <span className="text-xl shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <main className="flex-1 overflow-auto" role="main">
        {children}
      </main>
    </div>
  );
}
