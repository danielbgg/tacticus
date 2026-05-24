import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PerfilForm } from "@/features/perfil/components/PerfilForm";
import { useCriarPerfil } from "@/features/perfil/hooks/usePerfis";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import type { NivelJogador } from "@/shared/types/domain";

export function CriarPerfil() {
  const { t } = useTranslation("perfil");
  const navigate = useNavigate();
  const criar = useCriarPerfil();
  const setPerfilAtivo = usePerfilStore((s) => s.setPerfilAtivo);

  async function handleSubmit(dados: {
    nome: string;
    nivel: NivelJogador;
    avatar: string;
    acertosParaDominar: number;
  }) {
    const perfil = await criar.mutateAsync(dados);
    setPerfilAtivo(perfil.id);
    navigate({ to: "/home" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-fundo)] p-6">
      <div className="w-full max-w-md">
        <header className="mb-8">
          <button
            onClick={() => navigate({ to: "/" })}
            className="mb-4 flex items-center gap-1 text-sm text-[var(--color-conteudo-secundario)] hover:text-[var(--color-conteudo-primario)]"
            aria-label="Voltar para seleção de perfil"
          >
            ← {t("voltar")}
          </button>
          <h1 className="text-2xl font-bold text-[var(--color-conteudo-primario)]">
            {t("novoPerfil")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-conteudo-secundario)]">
            {t("novoPerfilDescricao")}
          </p>
        </header>

        <PerfilForm
          onSubmit={handleSubmit}
          carregando={criar.isPending}
          erro={criar.isError ? t("erroAoCriar") : null}
        />
      </div>
    </div>
  );
}
