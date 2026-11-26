"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { updateTheme } from "@/app/actions/shop";
import { BUSINESS_TYPES, getBusinessType } from "@/lib/catalog-config";
import {
  getTheme,
  type Accent,
  type Level,
  LEVELS,
  THEMES,
  themesForType,
  typesForTheme,
} from "@/lib/themes";
import { cx } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemePreview } from "./ThemePreview";

const levelIndex = (level: Level) => LEVELS.findIndex((l) => l.id === level);

const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  budget:   { label: "Budget",   color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  standard: { label: "Standard", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  premium:  { label: "Premium",  color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
};

export function ThemeForm({
  initial,
  paid,
  shopName,
  shopSlug,
  recommended,
  businessType,
  hasShopPhotos,
}: {
  initial: { theme: string; accent: string; hideBranding: boolean };
  paid: boolean;
  shopName: string;
  shopSlug: string;
  recommended: string;
  businessType: string;
  hasShopPhotos: boolean;
}) {
  const router = useRouter();
  const [themeId, setThemeId] = useState(initial.theme);
  const [tab, setTab] = useState("foryou");
  const [accentId, setAccentId] = useState(initial.accent);
  const [hideBranding, setHideBranding] = useState(initial.hideBranding);
  const [pending, startTransition] = useTransition();

  const theme = getTheme(themeId) ?? THEMES[0];
  const accent = theme.accents.find((a) => a.id === accentId) ?? theme.accents[0];
  const changed =
    theme.id !== initial.theme ||
    accent.id !== initial.accent ||
    hideBranding !== initial.hideBranding;

  const own = getBusinessType(businessType);

  const pickTheme = (id: string) => {
    const next = getTheme(id);
    if (!next) return;
    setThemeId(id);
    if (!next.accents.some((a) => a.id === accentId)) setAccentId(next.accents[0].id);
  };

  const save = () => {
    startTransition(async () => {
      try {
        const result = await updateTheme({ theme: theme.id, accent: accent.id, hideBranding });
        if (!result.ok) { toast.error(result.error); return; }
        toast.success(`${theme.name} theme saved.`, {
          action: {
            label: "View shop",
            onClick: () => window.open(`/${shopSlug}`, "_blank", "noopener,noreferrer"),
          },
        });
        router.refresh();
      } catch {
        toast.error("Could not save. Check your internet and try again.");
      }
    });
  };

  // Tabs
  const otherTypes = BUSINESS_TYPES.filter((b) => b.id !== businessType);
  const tabs = [
    { id: "foryou", label: "For You", emoji: own.emoji, count: themesForType(businessType).length },
    { id: "all",    label: "All",     emoji: "✨",       count: THEMES.length },
    ...otherTypes.map((b) => ({ id: b.id, label: b.name, emoji: b.emoji, count: themesForType(b.id).length })),
  ];

  const shownThemes = (() => {
    if (tab === "foryou") return themesForType(businessType).sort((a, b) => levelIndex(a.level) - levelIndex(b.level));
    if (tab === "all")    return [...THEMES].sort((a, b) => levelIndex(a.level) - levelIndex(b.level));
    return themesForType(tab).sort((a, b) => levelIndex(a.level) - levelIndex(b.level));
  })();

  // Group by level when showing "all"
  const grouped = tab === "all"
    ? LEVELS.map((l) => ({ level: l, themes: shownThemes.filter((t) => t.level === l.id) })).filter((g) => g.themes.length > 0)
    : [{ level: null, themes: shownThemes }];

  return (
    <div className="pb-24">
      {/* ── Page header ── */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Theme & Colour</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Choose how your shop looks to customers. Every theme is free.
        </p>
      </div>

      {/* ── 2-column layout ── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">

        {/* ── LEFT: Theme picker ── */}
        <div className="min-w-0 flex-1">

          {/* Tabs */}
          <div
            className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2 no-scrollbar"
            role="tablist"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all",
                  tab === t.id
                    ? "border-brand bg-brand text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600",
                )}
              >
                <span className="mr-1.5">{t.emoji}</span>
                {t.label}
                <span className="ml-1.5 rounded-full bg-black/10 px-1.5 py-px text-[10px] font-semibold dark:bg-white/10">
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Theme grid */}
          <div className="mt-3 space-y-6">
            {grouped.map(({ level, themes }) => (
              <div key={level?.id ?? "all"}>
                {level && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-semibold", LEVEL_LABELS[level.id].color)}>
                      {level.sign} {level.name}
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>
                )}
                {themes.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                    No themes here yet. Try &quot;All&quot;.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {themes.map((t) => {
                      const selected = t.id === themeId;
                      const displayAccent = selected ? accent : t.accents[0];
                      const lvl = LEVEL_LABELS[t.level];
                      return (
                        <button
                          key={t.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => pickTheme(t.id)}
                          className={cx(
                            "group relative overflow-hidden rounded-2xl text-left transition-all duration-200",
                            selected
                              ? "ring-2 ring-brand ring-offset-2 shadow-lg shadow-brand/10"
                              : "ring-1 ring-slate-200 hover:ring-slate-300 hover:shadow-md dark:ring-slate-700 dark:hover:ring-slate-600",
                          )}
                        >
                          {/* Preview — taller */}
                          <ThemePreview
                            theme={t}
                            accent={displayAccent}
                            shopName={shopName}
                            className="h-48"
                          />

                          {/* Selected checkmark */}
                          {selected && (
                            <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand shadow-md">
                              <Check className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}

                          {/* Info bar */}
                          <div className="bg-white px-3 py-2.5 dark:bg-slate-900">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</span>
                                  {t.id === recommended && (
                                    <span className="rounded-full bg-brand/10 px-1.5 py-px text-[9px] font-semibold text-brand dark:bg-brand/20">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400 line-clamp-1">
                                  {t.tagline}
                                </p>
                              </div>
                              <span className={cx("mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", lvl.color)}>
                                {t.level === "budget" ? "₹" : t.level === "standard" ? "₹₹" : "₹₹₹"}
                              </span>
                            </div>

                            {/* Colour dots */}
                            <div className="mt-2 flex items-center gap-1.5">
                              {t.accents.map((a) => (
                                <span
                                  key={a.id}
                                  title={a.name}
                                  className={cx(
                                    "h-3.5 w-3.5 rounded-full ring-1 ring-black/10 transition-transform",
                                    selected && a.id === accentId ? "scale-125 ring-2 ring-offset-1 ring-slate-800 dark:ring-slate-200" : "group-hover:scale-110",
                                  )}
                                  style={{
                                    background: t.dark
                                      ? `linear-gradient(135deg, ${t.colors.bg} 50%, ${a.primary} 50%)`
                                      : a.primary,
                                  }}
                                />
                              ))}
                              {t.header === "cover" && !hasShopPhotos && (
                                <span className="ml-auto text-[9px] text-amber-600 dark:text-amber-400">
                                  ⚠ needs photo
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Selected theme detail (sticky on desktop) ── */}
        <div className="w-full lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-4 space-y-4">

            {/* Large preview */}
            <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm">
              <ThemePreview
                theme={theme}
                accent={accent}
                shopName={shopName}
                className="h-64"
              />
              <div className="bg-white px-4 py-3 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{theme.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{theme.tagline}</p>
                  </div>
                  <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold", LEVEL_LABELS[theme.level].color)}>
                    {LEVELS.find((l) => l.id === theme.level)?.sign}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                  Made for: {typesForTheme(theme.id).map((id) => getBusinessType(id).name).join(", ")}
                </p>
                {theme.header === "cover" && (
                  <p className={cx("mt-1 text-[11px]", hasShopPhotos ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                    {hasShopPhotos ? "✓ Uses your shop photo at the top." : "⚠ Add a shop photo for best results."}
                  </p>
                )}
              </div>
            </div>

            {/* Colour picker */}
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <Palette className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Colour</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 gap-2">
                  {theme.accents.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={a.id === accent.id}
                      onClick={() => setAccentId(a.id)}
                      className={cx(
                        "flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all",
                        a.id === accent.id
                          ? "border-slate-900 bg-slate-50 dark:border-slate-100 dark:bg-slate-800"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800",
                      )}
                    >
                      <span
                        className="h-8 w-8 shrink-0 rounded-lg shadow-sm ring-1 ring-black/10"
                        style={{
                          background: theme.dark
                            ? `linear-gradient(135deg, ${theme.colors.bg} 50%, ${a.primary} 50%)`
                            : a.primary,
                        }}
                      />
                      <span className="flex-1 text-left text-slate-800 dark:text-slate-200">{a.name}</span>
                      {a.id === accent.id && (
                        <Check className="h-4 w-4 text-slate-900 dark:text-slate-100" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hide branding */}
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 shadow-sm">
              <label className={cx("flex items-start gap-3 p-4 text-sm", !paid && "cursor-not-allowed opacity-60")}>
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 accent-brand dark:accent-slate-200"
                  disabled={!paid}
                  checked={hideBranding}
                  onChange={(e) => setHideBranding(e.target.checked)}
                />
                <span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    Hide &quot;Made with Apnacatalog&quot;
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    Remove the footer branding from your shop page.
                  </span>
                  {!paid && (
                    <>
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                        <Icon name="lock" className="h-3 w-3" /> Paid plan only
                      </span>
                      <Link href="/dashboard/plan" className="mt-0.5 block text-xs text-brand underline">
                        Upgrade →
                      </Link>
                    </>
                  )}
                </span>
              </label>
            </div>

            {/* Save button (desktop) */}
            <div className="hidden lg:block space-y-2">
              <Button
                type="button"
                onClick={save}
                disabled={pending || !changed}
                className="w-full"
                size="lg"
              >
                {pending ? "Saving…" : changed ? "Save theme" : "Saved ✓"}
              </Button>
              <Link
                href={`/${shopSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outline", className: "w-full" })}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview shop
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky save bar (mobile only) ── */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span
              className="h-7 w-7 shrink-0 rounded-lg shadow-sm ring-1 ring-black/10"
              style={{
                background: theme.dark
                  ? `linear-gradient(135deg, ${theme.colors.bg} 50%, ${accent.primary} 50%)`
                  : accent.primary,
              }}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{theme.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{accent.name}{!changed && " · saved"}</p>
            </div>
          </div>
          <Link
            href={`/${shopSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Eye className="h-4 w-4" />
          </Link>
          <Button type="button" onClick={save} disabled={pending || !changed} size="sm">
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
