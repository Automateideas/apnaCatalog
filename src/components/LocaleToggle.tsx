"use client";

import { useLocale } from "@/lib/i18n";

export function LocaleToggle() {
  const [locale, setLocale] = useLocale();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "en" ? "hi" : "en")}
      aria-label={locale === "en" ? "Switch to Hindi" : "Switch to English"}
      className="flex size-9 items-center justify-center rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
    >
      {locale === "en" ? "हि" : "EN"}
    </button>
  );
}
