import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Card } from "@/shared/components/Card/Card";
import { Button } from "@/shared/components/Button/Button";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { getDb } from "@/db/schema";
import { salvarConfiguracoes } from "@/db/queries/configuracoes";
import type {
  ConfiguracoesPerfil,
  TemaInterface,
  EstiloTabuleiro,
  ConjuntoPecas,
  AnimacaoLances,
} from "@/shared/types/domain";
import { Tabuleiro } from "@/shared/components/Tabuleiro/Tabuleiro";

const TEMAS: { valor: TemaInterface; label: string }[] = [
  { valor: "claro", label: "Claro" },
  { valor: "escuro", label: "Escuro" },
  { valor: "madeira", label: "Madeira" },
];

const ESTILOS_TABULEIRO: { valor: EstiloTabuleiro; label: string }[] = [
  { valor: "classico", label: "Clássico" },
  { valor: "neo", label: "Neo" },
  { valor: "madeira", label: "Madeira" },
  { valor: "marmore", label: "Mármore" },
  { valor: "azul", label: "Azul" },
  { valor: "verde", label: "Verde" },
];

const CONJUNTOS_PECAS: { valor: ConjuntoPecas; label: string }[] = [
  { valor: "cburnett", label: "CBurnett" },
  { valor: "merida", label: "Merida" },
  { valor: "alpha", label: "Alpha" },
  { valor: "pirouetti", label: "Pirouetti" },
  { valor: "fantasy", label: "Fantasy" },
];

const IDIOMAS = [
  { valor: "pt-BR", label: "Português (BR)" },
  { valor: "en", label: "English" },
  { valor: "es", label: "Español" },
];

const FEN_DEMO = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4";

export function ConfiguracoesPage() {
  const { t } = useTranslation("comum");
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);
  const configuracoes = usePerfilStore((s) => s.configuracoes);
  const setConfiguracoes = usePerfilStore((s) => s.setConfiguracoes);

  const [config, setConfig] = useState<Partial<ConfiguracoesPerfil>>(
    configuracoes ?? {
      tema: "escuro",
      estiloTabuleiro: "classico",
      conjuntoPecas: "cburnett",
      animacaoLances: "normal",
      somHabilitado: true,
      modoDaltonico: false,
      idioma: "pt-BR",
    },
  );
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (configuracoes) setConfig(configuracoes);
  }, [configuracoes]);

  function atualizar<K extends keyof ConfiguracoesPerfil>(campo: K, valor: ConfiguracoesPerfil[K]) {
    setConfig((c) => ({ ...c, [campo]: valor }));
    if (campo === "tema") {
      document.documentElement.dataset["tema"] = valor as string;
    }
  }

  async function handleSalvar() {
    if (!perfilAtivoId) return;
    setSalvando(true);
    try {
      const completo: ConfiguracoesPerfil = {
        perfilId: perfilAtivoId,
        tema: config.tema ?? "escuro",
        estiloTabuleiro: config.estiloTabuleiro ?? "classico",
        conjuntoPecas: config.conjuntoPecas ?? "cburnett",
        animacaoLances: config.animacaoLances ?? "normal",
        somHabilitado: config.somHabilitado ?? true,
        modoDaltonico: config.modoDaltonico ?? false,
        idioma: config.idioma ?? "pt-BR",
      };
      const db = await getDb();
      await salvarConfiguracoes(db as never, completo);
      setConfiguracoes(completo);
      i18n.changeLanguage(completo.idioma);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold text-[var(--color-conteudo-primario)]">Configurações</h1>

      <Card>
        <h2 className="mb-4 font-semibold text-[var(--color-conteudo-primario)]">Tema</h2>
        <div className="flex gap-3">
          {TEMAS.map((t) => (
            <button
              key={t.valor}
              onClick={() => atualizar("tema", t.valor)}
              aria-pressed={config.tema === t.valor}
              className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                config.tema === t.valor
                  ? "border-[var(--color-acento)] text-[var(--color-acento)]"
                  : "border-[var(--color-borda)] text-[var(--color-conteudo-secundario)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-[var(--color-conteudo-primario)]">Tabuleiro</h2>
        <div className="grid grid-cols-[1fr_160px] gap-6 items-start">
          <div className="flex flex-col gap-3">
            <label className="text-sm text-[var(--color-conteudo-secundario)]">Estilo</label>
            <div className="grid grid-cols-3 gap-2">
              {ESTILOS_TABULEIRO.map((e) => (
                <button
                  key={e.valor}
                  onClick={() => atualizar("estiloTabuleiro", e.valor)}
                  aria-pressed={config.estiloTabuleiro === e.valor}
                  className={`rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                    config.estiloTabuleiro === e.valor
                      ? "border-[var(--color-acento)] bg-[var(--color-acento)]/10 text-[var(--color-acento)]"
                      : "border-[var(--color-borda)] text-[var(--color-conteudo-secundario)]"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <Tabuleiro
            fen={FEN_DEMO}
            {...(config.estiloTabuleiro != null ? { estiloTabuleiro: config.estiloTabuleiro } : {})}
            {...(config.modoDaltonico != null ? { modoDaltonico: config.modoDaltonico } : {})}
            className="w-full"
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-[var(--color-conteudo-primario)]">
          Conjunto de peças
        </h2>
        <div className="flex flex-wrap gap-2">
          {CONJUNTOS_PECAS.map((c) => (
            <button
              key={c.valor}
              onClick={() => atualizar("conjuntoPecas", c.valor)}
              aria-pressed={config.conjuntoPecas === c.valor}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                config.conjuntoPecas === c.valor
                  ? "border-[var(--color-acento)] text-[var(--color-acento)]"
                  : "border-[var(--color-borda)] text-[var(--color-conteudo-secundario)]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-[var(--color-conteudo-primario)]">Acessibilidade</h2>
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="font-medium text-[var(--color-conteudo-primario)]">Modo daltônico</p>
            <p className="text-sm text-[var(--color-conteudo-secundario)]">
              Usa cores acessíveis para daltonismo
            </p>
          </div>
          <button
            role="switch"
            aria-checked={config.modoDaltonico}
            onClick={() => atualizar("modoDaltonico", !config.modoDaltonico)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              config.modoDaltonico ? "bg-[var(--color-acento)]" : "bg-[var(--color-borda)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                config.modoDaltonico ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-[var(--color-conteudo-primario)]">Idioma</h2>
        <div className="flex gap-2">
          {IDIOMAS.map((i) => (
            <button
              key={i.valor}
              onClick={() => atualizar("idioma", i.valor as ConfiguracoesPerfil["idioma"])}
              aria-pressed={config.idioma === i.valor}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                config.idioma === i.valor
                  ? "border-[var(--color-acento)] text-[var(--color-acento)]"
                  : "border-[var(--color-borda)] text-[var(--color-conteudo-secundario)]"
              }`}
            >
              {i.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSalvar} variant="primary" isLoading={salvando}>
          Salvar configurações
        </Button>
        {salvo && <span className="text-sm text-green-500">✓ Salvo com sucesso</span>}
      </div>
    </div>
  );
}
