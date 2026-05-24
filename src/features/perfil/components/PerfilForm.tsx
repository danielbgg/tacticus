import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/Button/Button";
import { AvatarPicker } from "./AvatarPicker";
import { validarPerfil } from "@/features/perfil/domain/nivelParaCurriculo";
import type { NivelJogador } from "@/shared/types/domain";

interface PerfilFormProps {
  onSubmit: (dados: {
    nome: string;
    nivel: NivelJogador;
    avatar: string;
    acertosParaDominar: number;
  }) => void;
  carregando?: boolean;
  erro?: string | null;
}

const NIVEIS: { valor: NivelJogador; label: string }[] = [
  { valor: "iniciante", label: "Iniciante (< 1200)" },
  { valor: "intermediario", label: "Intermediário (1200–1800)" },
  { valor: "avancado", label: "Avançado (1800–2200)" },
  { valor: "mestre", label: "Mestre (> 2200)" },
];

export function PerfilForm({ onSubmit, carregando = false, erro }: PerfilFormProps) {
  const { t } = useTranslation("perfil");
  const [nome, setNome] = useState("");
  const [nivel, setNivel] = useState<NivelJogador>("iniciante");
  const [avatar, setAvatar] = useState("♙");
  const [acertosParaDominar, setAcertosParaDominar] = useState(5);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validacao = validarPerfil({ nome, nivel, avatar, acertosParaDominar });
    if (!validacao.ok) {
      setErroLocal(validacao.error);
      return;
    }
    setErroLocal(null);
    onSubmit({ nome, nivel, avatar, acertosParaDominar });
  }

  const erroExibido = erroLocal ?? erro;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nome" className="text-sm font-medium text-[var(--color-conteudo-primario)]">
          {t("form.nome")}
        </label>
        <input
          id="nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={30}
          placeholder={t("form.nomePlaceholder")}
          className="rounded-lg border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] px-3 py-2 text-[var(--color-conteudo-primario)] outline-none focus:border-[var(--color-acento)] focus:ring-2 focus:ring-[var(--color-acento)]/30"
          aria-required="true"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="nivel"
          className="text-sm font-medium text-[var(--color-conteudo-primario)]"
        >
          {t("form.nivel")}
        </label>
        <select
          id="nivel"
          value={nivel}
          onChange={(e) => setNivel(e.target.value as NivelJogador)}
          className="rounded-lg border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] px-3 py-2 text-[var(--color-conteudo-primario)] outline-none focus:border-[var(--color-acento)] focus:ring-2 focus:ring-[var(--color-acento)]/30"
        >
          {NIVEIS.map((n) => (
            <option key={n.valor} value={n.valor}>
              {n.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="acertos"
          className="text-sm font-medium text-[var(--color-conteudo-primario)]"
        >
          {t("form.acertosParaDominar")} ({acertosParaDominar})
        </label>
        <input
          id="acertos"
          type="range"
          min={3}
          max={10}
          value={acertosParaDominar}
          onChange={(e) => setAcertosParaDominar(Number(e.target.value))}
          className="accent-[var(--color-acento)]"
        />
        <div className="flex justify-between text-xs text-[var(--color-conteudo-secundario)]">
          <span>3 (mais fácil)</span>
          <span>10 (mais difícil)</span>
        </div>
      </div>

      <AvatarPicker valor={avatar} onChange={setAvatar} />

      {erroExibido && (
        <p role="alert" className="text-sm text-red-500">
          {erroExibido}
        </p>
      )}

      <Button type="submit" variant="primary" isLoading={carregando} className="mt-2">
        {t("form.criar")}
      </Button>
    </form>
  );
}
