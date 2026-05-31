import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Card } from "@/shared/components/Card/Card";
import { Button } from "@/shared/components/Button/Button";
import { usePerfilStore } from "@/features/perfil/store/usePerfilStore";
import { usePerfis, useExcluirPerfil, useRenomearPerfil } from "@/features/perfil/hooks/usePerfis";
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
  const navigate = useNavigate();
  const perfilAtivoId = usePerfilStore((s) => s.perfilAtivoId);
  const configuracoes = usePerfilStore((s) => s.configuracoes);
  const setConfiguracoes = usePerfilStore((s) => s.setConfiguracoes);
  const setPerfilAtivo = usePerfilStore((s) => s.setPerfilAtivo);
  const excluirPerfil = useExcluirPerfil();
  const renomearPerfil = useRenomearPerfil();
  const { data: perfis } = usePerfis();
  const perfilAtivo = perfis?.find((p) => p.id === perfilAtivoId) ?? null;

  const [excluindo, setExcluindo] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [renomeando, setRenomeando] = useState(false);
  const [renomeado, setRenomeado] = useState(false);

  useEffect(() => {
    if (perfilAtivo) setNovoNome(perfilAtivo.nome);
  }, [perfilAtivo?.nome]);

  const [config, setConfig] = useState<Partial<ConfiguracoesPerfil>>(
    configuracoes ?? {
      tema: "escuro",
      estiloTabuleiro: "classico",
      conjuntoPecas: "cburnett",
      animacaoLances: "normal",
      somHabilitado: true,
      modoDaltonico: false,
      idioma: "pt-BR",
      metaDiaria: 0,
      modoCronometrado: false,
      tempoCronometroS: 60,
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
        metaDiaria: config.metaDiaria ?? 0,
        modoCronometrado: config.modoCronometrado ?? false,
        tempoCronometroS: config.tempoCronometroS ?? 60,
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

  async function handleRenomear() {
    if (!perfilAtivoId || !novoNome.trim() || novoNome.trim() === perfilAtivo?.nome) return;
    setRenomeando(true);
    try {
      await renomearPerfil.mutateAsync({ id: perfilAtivoId, nome: novoNome.trim() });
      setRenomeado(true);
      setTimeout(() => setRenomeado(false), 2000);
    } finally {
      setRenomeando(false);
    }
  }

  function handleLogout() {
    setPerfilAtivo(null);
    navigate({ to: "/" });
  }

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-bold text-[var(--color-conteudo-primario)]">Configurações</h1>

      {/* Perfil */}
      <Card>
        <h2 className="mb-4 font-semibold text-[var(--color-conteudo-primario)]">Perfil</h2>
        <div className="flex flex-col gap-4">
          {/* Renomear */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="novoNome" className="text-sm text-[var(--color-conteudo-secundario)]">
              Nome
            </label>
            <div className="flex gap-2">
              <input
                id="novoNome"
                type="text"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                maxLength={30}
                className="flex-1 rounded-lg border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] px-3 py-2 text-sm text-[var(--color-conteudo-primario)] outline-none focus:border-[var(--color-acento)] focus:ring-2 focus:ring-[var(--color-acento)]/30"
              />
              <Button
                variant="ghost"
                onClick={handleRenomear}
                isLoading={renomeando}
                disabled={!novoNome.trim() || novoNome.trim() === perfilAtivo?.nome}
              >
                {renomeado ? "✓ Salvo" : "Renomear"}
              </Button>
            </div>
          </div>
          {/* Trocar perfil */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-borda)]">
            <div>
              <p className="text-sm font-medium text-[var(--color-conteudo-primario)]">
                Trocar perfil
              </p>
              <p className="text-xs text-[var(--color-conteudo-terciario)]">
                Volta para a tela de seleção de perfis
              </p>
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </Card>

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
        <h2 className="mb-4 font-semibold text-[var(--color-conteudo-primario)]">Treino</h2>
        <div className="flex flex-col gap-4">
          {/* Meta diária */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="metaDiaria"
              className="text-sm font-medium text-[var(--color-conteudo-primario)]"
            >
              Meta diária de acertos
            </label>
            <p className="text-xs text-[var(--color-conteudo-terciario)]">
              0 = desativada. Exibe barra de progresso na tela inicial.
            </p>
            <input
              id="metaDiaria"
              type="number"
              min={0}
              max={500}
              step={5}
              value={config.metaDiaria ?? 0}
              onChange={(e) => atualizar("metaDiaria", Math.max(0, parseInt(e.target.value) || 0))}
              className="w-32 rounded-lg border border-[var(--color-borda)] bg-[var(--color-superficie-primaria)] px-3 py-2 text-sm text-[var(--color-conteudo-primario)] outline-none focus:border-[var(--color-acento)] focus:ring-2 focus:ring-[var(--color-acento)]/30"
            />
          </div>

          {/* Modo cronometrado */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-[var(--color-conteudo-primario)]">Modo cronometrado</p>
              <p className="text-sm text-[var(--color-conteudo-secundario)]">
                Conta regressiva por exercício — ao zerar, exibe a solução
              </p>
            </div>
            <button
              role="switch"
              aria-checked={config.modoCronometrado}
              onClick={() => atualizar("modoCronometrado", !config.modoCronometrado)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                config.modoCronometrado ? "bg-[var(--color-acento)]" : "bg-[var(--color-borda)]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  config.modoCronometrado ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>

          {/* Duração do cronômetro */}
          {config.modoCronometrado && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="tempoCronometro"
                className="text-sm text-[var(--color-conteudo-secundario)]"
              >
                Tempo por exercício: <strong>{config.tempoCronometroS ?? 60}s</strong>
              </label>
              <input
                id="tempoCronometro"
                type="range"
                min={10}
                max={300}
                step={5}
                value={config.tempoCronometroS ?? 60}
                onChange={(e) => atualizar("tempoCronometroS", parseInt(e.target.value))}
                className="w-full accent-[var(--color-acento)]"
              />
              <div className="flex justify-between text-xs text-[var(--color-conteudo-terciario)]">
                <span>10s</span>
                <span>300s</span>
              </div>
            </div>
          )}
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

      {/* Zona de perigo */}
      <Card className="border-red-500/30">
        <h2 className="mb-1 font-semibold text-red-500">Zona de perigo</h2>
        <p className="mb-4 text-sm text-[var(--color-conteudo-secundario)]">
          Exclui permanentemente o perfil e todos os dados associados: progresso, tentativas,
          sessões e estatísticas. Esta ação não pode ser desfeita.
        </p>
        {confirmandoExclusao ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-red-400">
              ⚠ Tem certeza? Esta ação é irreversível.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                isLoading={excluindo}
                onClick={async () => {
                  if (!perfilAtivoId) return;
                  setExcluindo(true);
                  try {
                    await excluirPerfil.mutateAsync(perfilAtivoId);
                    setPerfilAtivo(null);
                    navigate({ to: "/" });
                  } finally {
                    setExcluindo(false);
                  }
                }}
                className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500"
              >
                Sim, excluir permanentemente
              </Button>
              <Button variant="ghost" onClick={() => setConfirmandoExclusao(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setConfirmandoExclusao(true)}
            className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500"
          >
            Excluir perfil e todos os dados
          </Button>
        )}
      </Card>
    </div>
  );
}
