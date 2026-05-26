import { AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { TacticusLogo } from "@/shared/components/TacticusLogo/TacticusLogo";
import { Skeleton } from "@/shared/components/Skeleton/Skeleton";
import { ErrorMessage } from "@/shared/components/ErrorMessage/ErrorMessage";
import { EmptyState } from "@/shared/components/EmptyState/EmptyState";
import { PerfilCard } from "@/features/perfil/components/PerfilCard";
import { usePerfis, useExcluirPerfil, useAtualizarAcesso } from "@/features/perfil/hooks/usePerfis";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import type { Perfil } from "@/shared/types/domain";

export function SelecaoPerfil() {
  const { t } = useTranslation("perfil");
  const navigate = useNavigate();
  const { data: perfis, isLoading, isError, refetch } = usePerfis();
  const excluir = useExcluirPerfil();
  const atualizarAcesso = useAtualizarAcesso();
  const setPerfilAtivo = usePerfilStore((s) => s.setPerfilAtivo);

  async function handleSelecionar(perfil: Perfil) {
    setPerfilAtivo(perfil.id);
    await atualizarAcesso.mutateAsync(perfil.id);
    navigate({ to: "/home" });
  }

  async function handleExcluir(perfil: Perfil) {
    if (!confirm(t("confirmarExclusao", { nome: perfil.nome }))) return;
    await excluir.mutateAsync(perfil.id);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-fundo)] p-6">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <div className="flex justify-center" aria-hidden="true">
            <TacticusLogo
              showText={false}
              className="h-16 w-16 text-[var(--color-conteudo-primario)]"
            />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-[0.12em] uppercase text-[var(--color-conteudo-primario)]">
            Tacticus
          </h1>
          <p className="mt-1 text-[var(--color-conteudo-secundario)]">{t("selecionePerfil")}</p>
        </header>

        {isLoading && (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando perfis">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {isError && <ErrorMessage mensagem={t("erroCarregar")} onTentar={() => refetch()} />}

        {!isLoading && !isError && (
          <>
            {perfis && perfis.length > 0 ? (
              <ul className="flex flex-col gap-3" role="list" aria-label="Perfis disponíveis">
                <AnimatePresence>
                  {perfis.map((perfil) => (
                    <li key={perfil.id} role="listitem">
                      <PerfilCard
                        perfil={perfil}
                        onSelecionar={handleSelecionar}
                        {...(perfis.length > 1 ? { onExcluir: handleExcluir } : {})}
                      />
                    </li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <EmptyState
                icone="♙"
                titulo={t("semPerfis")}
                descricao={t("semPerfisDescricao")}
                acaoLabel={t("criarPerfil")}
                onAcao={() => navigate({ to: "/perfil/novo" })}
              />
            )}

            {perfis && perfis.length > 0 && (
              <button
                onClick={() => navigate({ to: "/perfil/novo" })}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-borda)] py-3 text-sm text-[var(--color-conteudo-secundario)] transition-colors hover:border-[var(--color-acento)] hover:text-[var(--color-acento)]"
              >
                + {t("criarPerfil")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
