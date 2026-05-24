import { useEffect } from "react";

type AtalhoMap = Record<string, (e: KeyboardEvent) => void>;

export function useKeyboard(atalhos: AtalhoMap, ativo = true): void {
  useEffect(() => {
    if (!ativo) return;

    function handler(e: KeyboardEvent) {
      // Não interceptar quando foco estiver em input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

      const key = [
        e.ctrlKey ? "Ctrl+" : "",
        e.altKey ? "Alt+" : "",
        e.shiftKey ? "Shift+" : "",
        e.key,
      ].join("");

      const callback = atalhos[key] ?? atalhos[e.key];
      if (callback) {
        e.preventDefault();
        callback(e);
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [atalhos, ativo]);
}
