"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import en from "./locales/en.json";
import hi from "./locales/hi.json";

export type Locale = "en" | "hi";
type Dict = typeof en;
export type TKey = keyof Dict;

const dicts: Record<Locale, Dict> = { en, hi };

const KEY = "ac-locale";

function getSnapshot(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const v = localStorage.getItem(KEY);
    if (v === "hi") return "hi";
  } catch {}
  return "en";
}

function getServerSnapshot(): Locale {
  return "en";
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function setLocale(l: Locale) {
  try { localStorage.setItem(KEY, l); } catch {}
  listeners.forEach((cb) => cb());
}

export function useLocale(): [Locale, (l: Locale) => void] {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [locale, setLocale];
}

export function useT() {
  const [locale] = useLocale();
  return useCallback((key: TKey) => dicts[locale][key] ?? dicts.en[key] ?? key, [locale]);
}

export const LocaleContext = createContext<Locale>("en");
export const useLocaleContext = () => useContext(LocaleContext);
