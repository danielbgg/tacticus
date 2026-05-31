import type { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { TacticusLogo } from "@/shared/components/TacticusLogo/TacticusLogo";
import {
  IconHome,
  IconCirculos,
  IconTematico,
  IconRevisao,
  IconEstatisticas,
  IconConfiguracoes,
  IconTrocarPerfil,
} from "./NavIcons";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/home", label: "Início", Icon: IconHome },
  { path: "/circulos", label: "Círculos", Icon: IconCirculos },
  { path: "/tematico", label: "Temático", Icon: IconTematico },
  { path: "/revisao", label: "Revisão", Icon: IconRevisao },
  { path: "/estatisticas", label: "Estatísticas", Icon: IconEstatisticas },
  { path: "/configuracoes", label: "Configurações", Icon: IconConfiguracoes },
] as const;

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });
  const configuracoes = usePerfilStore((s) => s.configuracoes);
  const setPerfilAtivo = usePerfilStore((s) => s.setPerfilAtivo);
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
          className="flex flex-col h-full w-52 shrink-0"
          style={{
            background: "var(--color-superficie-primaria)",
            borderRight: "1px solid var(--color-borda)",
            boxShadow: "2px 0 8px rgba(0,0,0,0.18)",
          }}
        >
          {/* Logo */}
          <div
            className="px-4 py-4 flex items-center"
            style={{ borderBottom: "1px solid var(--color-borda)" }}
          >
            <TacticusLogo className="text-[var(--color-conteudo-primario)]" />
          </div>

          {/* Itens de nav */}
          <ul className="flex flex-col gap-0.5 p-2 mt-2 flex-1" role="list">
            {navItems.map(({ path, label, Icon }) => (
              <li key={path} role="listitem">
                <Link
                  to={path}
                  className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150"
                  style={{ color: "var(--color-conteudo-secundario)" }}
                >
                  {({ isActive }) => (
                    <>
                      {/* Barra dourada no item ativo */}
                      {isActive && (
                        <span
                          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                          style={{ background: "var(--color-acento)" }}
                          aria-hidden="true"
                        />
                      )}
                      {/* Background do item ativo */}
                      {isActive && (
                        <span
                          className="absolute inset-0 rounded-lg"
                          style={{ background: "var(--color-superficie-secundaria)", opacity: 0.8 }}
                          aria-hidden="true"
                        />
                      )}
                      {/* Ícone colorido */}
                      <span className="relative shrink-0 w-5 h-5 flex items-center justify-center">
                        <Icon size={20} active={isActive} />
                      </span>
                      {/* Label */}
                      <span
                        className="relative text-sm whitespace-nowrap"
                        style={{
                          fontWeight: isActive ? 600 : 400,
                          color: isActive
                            ? "var(--color-conteudo-primario)"
                            : "var(--color-conteudo-secundario)",
                        }}
                      >
                        {label}
                      </span>
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Divisor + Trocar perfil */}
          <div className="p-2 pb-3" style={{ borderTop: "1px solid var(--color-borda)" }}>
            <button
              onClick={() => {
                setPerfilAtivo(null);
                navigate({ to: "/" });
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 hover:bg-[var(--color-superficie-secundaria)]"
              style={{ color: "var(--color-conteudo-terciario)" }}
            >
              <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                <IconTrocarPerfil size={20} />
              </span>
              <span className="text-sm font-medium whitespace-nowrap">Trocar perfil</span>
            </button>
          </div>
        </nav>
      )}
      <main className="flex-1 overflow-auto" role="main">
        {children}
      </main>
    </div>
  );
}
