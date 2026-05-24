import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ptBRComum from "@/locales/pt-BR/comum/index.json";
import ptBRPerfil from "@/locales/pt-BR/perfil/index.json";
import ptBRExercicio from "@/locales/pt-BR/exercicio/index.json";
import ptBRSessao from "@/locales/pt-BR/sessao/index.json";
import ptBREstatisticas from "@/locales/pt-BR/estatisticas/index.json";
import ptBRBanco from "@/locales/pt-BR/banco/index.json";

void i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": {
      comum: ptBRComum,
      perfil: ptBRPerfil,
      exercicio: ptBRExercicio,
      sessao: ptBRSessao,
      estatisticas: ptBREstatisticas,
      banco: ptBRBanco,
    },
  },
  lng: "pt-BR",
  fallbackLng: "pt-BR",
  ns: ["comum", "perfil", "exercicio", "sessao", "estatisticas", "banco"],
  defaultNS: "comum",
  interpolation: { escapeValue: false },
});

export default i18n;
