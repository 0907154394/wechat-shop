"use client";

import { useState, useEffect, type ReactNode } from "react";
import type { Lang } from "./i18n";

const LANG_KEY = "lang";
const LANGS: Lang[] = ["VI", "EN", "ZH"];

let _lang: Lang = "VI";
const _subs = new Set<(lang: Lang) => void>();

function _init(): Lang {
  if (typeof window === "undefined") return "VI";
  const v = localStorage.getItem(LANG_KEY) as Lang | null;
  return LANGS.includes(v as Lang) ? (v as Lang) : "VI";
}

function _set(next: Lang) {
  _lang = next;
  if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, next);
  _subs.forEach(fn => fn(next));
}

export function useLang(): { lang: Lang; toggleLang: () => void; setLang: (l: Lang) => void } {
  const [lang, setLang] = useState<Lang>("VI");

  useEffect(() => {
    const stored = _init();
    _lang = stored;
    setLang(stored);
    _subs.add(setLang);
    return () => { _subs.delete(setLang); };
  }, []);

  function toggleLang() {
    const idx = LANGS.indexOf(_lang);
    _set(LANGS[(idx + 1) % LANGS.length]);
  }

  function changeLang(l: Lang) {
    _set(l);
  }

  return { lang, toggleLang, setLang: changeLang };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
