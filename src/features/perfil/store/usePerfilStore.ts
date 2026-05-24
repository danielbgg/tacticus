import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Perfil, ConfiguracoesPerfil } from "@/shared/types/domain";
import type { PerfilId } from "@/shared/types/branded";

interface PerfilState {
  perfilAtivoId: PerfilId | null;
  perfis: Perfil[];
  configuracoes: ConfiguracoesPerfil | null;

  setPerfilAtivo: (id: PerfilId | null) => void;
  setPerfis: (perfis: Perfil[]) => void;
  setConfiguracoes: (config: ConfiguracoesPerfil) => void;
  adicionarPerfil: (perfil: Perfil) => void;
  removerPerfil: (id: PerfilId) => void;
}

export const usePerfilStore = create<PerfilState>()(
  persist(
    (set) => ({
      perfilAtivoId: null,
      perfis: [],
      configuracoes: null,

      setPerfilAtivo: (id) => set({ perfilAtivoId: id }),

      setPerfis: (perfis) => set({ perfis }),

      setConfiguracoes: (configuracoes) => {
        set({ configuracoes });
        if (typeof document !== "undefined") {
          document.documentElement.dataset["tema"] = configuracoes.tema;
        }
      },

      adicionarPerfil: (perfil) => set((s) => ({ perfis: [perfil, ...s.perfis] })),

      removerPerfil: (id) =>
        set((s) => ({
          perfis: s.perfis.filter((p) => p.id !== id),
          perfilAtivoId: s.perfilAtivoId === id ? null : s.perfilAtivoId,
        })),
    }),
    {
      name: "perfil-store",
      partialize: (s) => ({ perfilAtivoId: s.perfilAtivoId }),
    },
  ),
);
