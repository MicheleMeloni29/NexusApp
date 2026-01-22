"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { defaultLanguage, messages, type Language } from "@/app/lang";

type TranslateParams = Record<string, string | number>;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: TranslateParams) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
const STORAGE_KEY = "nexus-language";

const getMessageValue = (key: string, language: Language) => {
  return key.split(".").reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in acc) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, messages[language]);
};

const interpolate = (value: string, params?: TranslateParams) => {
  if (!params) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, token) => {
    const replacement = params[token];
    return replacement === undefined ? "" : String(replacement);
  });
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "it" || stored === "en") {
      setLanguageState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(STORAGE_KEY, nextLanguage);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslateParams) => {
      const value = getMessageValue(key, language);
      if (typeof value !== "string") {
        return key;
      }
      return interpolate(value, params);
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
