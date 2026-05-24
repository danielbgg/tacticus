import { getDb } from "@/db/schema";
import type { ConquistaId, PerfilId } from "@/shared/types/branded";

type ConquistaRow = {
  conquista_id: string;
  perfil_id: string;
  desbloqueada_em: string;
  nome: string;
  descricao: string;
  icone: string;
};

export interface ConquistaDesbloqueada {
  conquistaId: ConquistaId;
  perfilId: PerfilId;
  desbloqueadaEm: Date;
  nome: string;
  descricao: string;
  icone: string;
}

export async function buscarConquistasPerfil(perfilId: PerfilId): Promise<ConquistaDesbloqueada[]> {
  const db = await getDb();
  const rows = await db.select<ConquistaRow[]>(
    `SELECT cp.conquista_id, cp.perfil_id, cp.desbloqueada_em,
            c.nome, c.descricao, c.icone
     FROM conquistas_perfil cp
     JOIN conquistas c ON c.id = cp.conquista_id
     WHERE cp.perfil_id = ?
     ORDER BY cp.desbloqueada_em DESC`,
    [perfilId],
  );

  return rows.map((r) => ({
    conquistaId: r.conquista_id as ConquistaId,
    perfilId: r.perfil_id as PerfilId,
    desbloqueadaEm: new Date(r.desbloqueada_em),
    nome: r.nome,
    descricao: r.descricao,
    icone: r.icone,
  }));
}

export async function registrarConquista(
  perfilId: PerfilId,
  conquistaId: ConquistaId,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT OR IGNORE INTO conquistas_perfil (perfil_id, conquista_id, desbloqueada_em)
     VALUES (?, ?, datetime('now'))`,
    [perfilId, conquistaId],
  );
}

export async function jaDesbloqueou(
  perfilId: PerfilId,
  conquistaId: ConquistaId,
): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select<Array<{ count: number }>>(
    `SELECT COUNT(*) as count FROM conquistas_perfil
     WHERE perfil_id = ? AND conquista_id = ?`,
    [perfilId, conquistaId],
  );
  const first = rows[0];
  return (first?.count ?? 0) > 0;
}

export async function registrarConquistasNovas(
  perfilId: PerfilId,
  conquistaIds: ConquistaId[],
): Promise<ConquistaId[]> {
  const novas: ConquistaId[] = [];
  for (const id of conquistaIds) {
    const existe = await jaDesbloqueou(perfilId, id);
    if (!existe) {
      await registrarConquista(perfilId, id);
      novas.push(id);
    }
  }
  return novas;
}
