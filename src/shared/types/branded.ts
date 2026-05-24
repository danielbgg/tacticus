export type PerfilId = string & { readonly _brand: "PerfilId" };
export type ExercicioId = string & { readonly _brand: "ExercicioId" };
export type SessaoId = string & { readonly _brand: "SessaoId" };
export type TentativaId = string & { readonly _brand: "TentativaId" };
export type PartidaId = string & { readonly _brand: "PartidaId" };
export type UnidadeId = string & { readonly _brand: "UnidadeId" };
export type ModuloId = string & { readonly _brand: "ModuloId" };
export type AreaId = string & { readonly _brand: "AreaId" };
export type ConquistaId = string & { readonly _brand: "ConquistaId" };

export function toPerfilId(s: string): PerfilId {
  return s as PerfilId;
}
export function toExercicioId(s: string): ExercicioId {
  return s as ExercicioId;
}
export function toSessaoId(s: string): SessaoId {
  return s as SessaoId;
}
export function toTentativaId(s: string): TentativaId {
  return s as TentativaId;
}
export function toPartidaId(s: string): PartidaId {
  return s as PartidaId;
}
export function toUnidadeId(s: string): UnidadeId {
  return s as UnidadeId;
}
export function toModuloId(s: string): ModuloId {
  return s as ModuloId;
}
export function toAreaId(s: string): AreaId {
  return s as AreaId;
}
export function toConquistaId(s: string): ConquistaId {
  return s as ConquistaId;
}
