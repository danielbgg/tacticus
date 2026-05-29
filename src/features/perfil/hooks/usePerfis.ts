import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDb } from "@/db/schema";
import {
  listarPerfis,
  criarPerfil,
  excluirPerfil,
  renomearPerfil,
  atualizarUltimoAcesso,
} from "@/db/queries/perfis";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import type { NivelJogador } from "@/shared/types/domain";
import type { PerfilId } from "@/shared/types/branded";

export function usePerfis() {
  return useQuery({
    queryKey: ["perfis"],
    queryFn: async () => {
      const db = await getDb();
      const resultado = await listarPerfis(db as never);
      if (!resultado.ok) throw new Error(resultado.error);
      return resultado.value;
    },
  });
}

export function useCriarPerfil() {
  const queryClient = useQueryClient();
  const adicionarPerfil = usePerfilStore((s) => s.adicionarPerfil);

  return useMutation({
    mutationFn: async (input: {
      nome: string;
      nivel: NivelJogador;
      avatar: string;
      acertosParaDominar: number;
    }) => {
      const db = await getDb();
      const resultado = await criarPerfil(db as never, input);
      if (!resultado.ok) throw new Error(resultado.error);
      return resultado.value;
    },
    onSuccess: (perfil) => {
      adicionarPerfil(perfil);
      queryClient.invalidateQueries({ queryKey: ["perfis"] });
    },
  });
}

export function useExcluirPerfil() {
  const queryClient = useQueryClient();
  const removerPerfil = usePerfilStore((s) => s.removerPerfil);

  return useMutation({
    mutationFn: async (id: PerfilId) => {
      const db = await getDb();
      const resultado = await excluirPerfil(db as never, id);
      if (!resultado.ok) throw new Error(resultado.error);
    },
    onSuccess: (_, id) => {
      removerPerfil(id);
      queryClient.invalidateQueries({ queryKey: ["perfis"] });
    },
  });
}

export function useRenomearPerfil() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nome }: { id: PerfilId; nome: string }) => {
      const db = await getDb();
      const resultado = await renomearPerfil(db as never, id, nome);
      if (!resultado.ok) throw new Error(resultado.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["perfis"] });
    },
  });
}

export function useAtualizarAcesso() {
  return useMutation({
    mutationFn: async (id: PerfilId) => {
      const db = await getDb();
      await atualizarUltimoAcesso(db as never, id);
    },
  });
}
