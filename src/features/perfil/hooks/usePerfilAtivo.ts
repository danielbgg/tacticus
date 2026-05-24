import { useQuery } from "@tanstack/react-query";
import { getDb } from "@/db/schema";
import { buscarPerfil } from "@/db/queries/perfis";
import { buscarConfiguracoes } from "@/db/queries/configuracoes";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";

export function usePerfilAtivo() {
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);
  const setConfiguracoes = usePerfilStore((s) => s.setConfiguracoes);

  return useQuery({
    queryKey: ["perfil", perfilAtivoId],
    enabled: perfilAtivoId !== null,
    queryFn: async () => {
      if (!perfilAtivoId) return null;
      const db = await getDb();
      const rPerfil = await buscarPerfil(db as never, perfilAtivoId);
      if (!rPerfil.ok) throw new Error(rPerfil.error);
      if (!rPerfil.value) return null;

      const rConfig = await buscarConfiguracoes(db as never, perfilAtivoId);
      if (rConfig.ok && rConfig.value) {
        setConfiguracoes(rConfig.value);
      }

      return rPerfil.value;
    },
  });
}
