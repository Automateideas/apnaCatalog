"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { updateTheme } from "@/app/actions/shop";
import { BUSINESS_TYPES, getBusinessType } from "@/lib/catalog-config";
import {
  getTheme,
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
import { Card } from "@/components/ui/card";
import { ThemePreview } from "./ThemePreview";

const levelIndex = (level: Level) => LEVELS.findIndex((l) => l.id === level);

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
  /** The default theme of this shop's business type. */
  recommended: string;
  businessType: string;
  hasShopPhotos: boolean;
}) {
  const router = useRouter();
  const [themeId, setThemeId] = useState(initial.theme);
  // Which business's themes to show. Starts on the owner's own business, but any theme can be used.
  const [forType, setForType] = useState<string>(businessType);
  const own = getBusinessType(businessType);
  const filters = [own, ...BUSINESS_TYPES.filter((b) => b.id !== own.id)];
  const shown =
    forType === "all"
      ? [...THEMES].sort((a, b) => levelIndex(a.level) - levelIndex(b.level))
      : themesForType(forType);
  const [accentId, setAccentId] = useState(initial.accent);
  const [hideBranding, setHideBranding] = useState(initial.hideBranding);
  const [pending, startTransition] = useTransition();

  const theme = getTheme(themeId) ?? THEMES[0];
  const accent =
    theme.accents.find((a) => a.id === accentId) ?? theme.accents[0];
  const changed =
    theme.id !== initial.theme ||
    accent.id !== initial.accent ||
    hideBranding !== initial.hideBranding;

  const pickTheme = (id: string) => {
    const next = getTheme(id);
    if (!next) return;
    setThemeId(id);
    // Keep the colour when the new theme has one with the same name, else use its first.
    if (!next.accents.some((a) => a.id === accentId))
      setAccentId(next.accents[0].id);
  };

  const save = () => {
    startTransition(async () => {
      try {
        const result = await updateTheme({
          theme: theme.id,
          accent: accent.id,
          hideBranding,
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(`${theme.name} theme saved.`, {
          action: {
            label: "View shop",
            onClick: () =>
              window.open(`/${shopSlug}`, "_blank", "noopener,noreferrer"),
          },
        });
        router.refresh();
      } catch {
        toast.error("Could not save. Check your internet and try again.");
      }
    });
  };

  return (
    <div className="space-y-5 pb-24">
      <section>
        <h2 className="font-bold text-slate-900 dark:text-slate-100">
          Choose a theme
        </h2>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
          Pick the look that matches your prices and customers. Each theme has
          its own fonts, shapes, header and item layout. All themes are free.
        </p>

        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          Themes made for (you can use a theme from any business):
        </p>
        <div
          className="-mx-1 mt-1.5 flex gap-1.5 overflow-x-auto px-1 pb-1"
          role="group"
          aria-label="Show themes for"
        >
          {[{ id: "all", name: "All themes", emoji: "✨" }, ...filters].map(
            (b) => {
              const count =
                b.id === "all" ? THEMES.length : themesForType(b.id).length;
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={forType === b.id}
                  onClick={() => setForType(b.id)}
                  className={cx(
                    "shrink-0 rounded-full border px-3 py-1 text-sm font-medium whitespace-nowrap transition",
                    forType === b.id
                      ? "border-brand bg-brand text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500",
                  )}
                >
                  <span className="mr-1">{b.emoji}</span>
                  {b.name}
                  {b.id === own.id && " (yours)"}
                  <span className="ml-1 opacity-70">{count}</span>
                </button>
              );
            },
          )}
        </div>

        {shown.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600 dark:border-slate-600 dark:text-slate-400">
            No themes here yet. Try &quot;All themes&quot;.
          </p>
        )}

        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => {
            const selected = t.id === theme.id;
            const bestFor = typesForTheme(t.id).map(
              (id) => getBusinessType(id).name,
            );
            const lvl = LEVELS.find((l) => l.id === t.level)!;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={selected}
                onClick={() => pickTheme(t.id)}
                className={cx(
                  "group overflow-hidden rounded-xl border-2 bg-card text-left transition",
                  selected
                    ? "border-brand ring-2 ring-brand/20"
                    : "border-slate-200 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500",
                )}
              >
                <ThemePreview
                  theme={t}
                  accent={selected ? accent : t.accents[0]}
                  shopName={shopName}
                  className="border-b border-slate-200 dark:border-slate-700"
                />
                <div className="p-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {t.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-semibold"
                      title={`${lvl.name} shops`}
                    >
                      {lvl.sign} {lvl.name}
                    </Badge>
                    {t.id === recommended && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                    {selected && (
                      <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-brand text-white">
                        <Check className="size-4" />
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                    {t.tagline}
                  </p>
                  {bestFor.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Made for: {bestFor.join(", ")}
                    </p>
                  )}
                  {t.header === "cover" && (
                    <p
                      className={cx(
                        "mt-1 text-xs",
                        hasShopPhotos
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {hasShopPhotos
                        ? "Uses your first shop photo at the top."
                        : "Looks best with a shop photo. Add one in Shop details."}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <Card className="p-5">
        <h2 className="font-bold text-slate-900 dark:text-slate-100">
          Colour for {theme.name}
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {theme.accents.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={a.id === accent.id}
              onClick={() => setAccentId(a.id)}
              className={cx(
                "flex items-center gap-2 rounded-full border-2 py-1.5 pr-3.5 pl-1.5 text-sm font-medium transition",
                a.id === accent.id
                  ? "border-slate-900 dark:border-slate-100"
                  : "border-slate-200 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500",
              )}
            >
              <span
                className="size-7 rounded-full ring-1 ring-black/10"
                style={{
                  background: theme.dark
                    ? `linear-gradient(135deg, ${theme.colors.bg} 50%, ${a.primary} 50%)`
                    : a.primary,
                }}
              />
              {a.name}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <label
          className={cx(
            "flex items-start gap-3 text-sm",
            !paid && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 accent-brand dark:accent-slate-200"
            disabled={!paid}
            checked={hideBranding}
            onChange={(e) => setHideBranding(e.target.checked)}
          />
          <span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              Hide &quot;Made with Apnacatalog&quot; on my shop page
            </span>
            {!paid && (
              <>
                <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <Icon name="lock" className="h-3 w-3" /> Paid
                </span>
                <Link
                  href="/dashboard/plan"
                  className="mt-0.5 block text-xs text-brand underline"
                >
                  See the paid plan
                </Link>
              </>
            )}
          </span>
        </label>
      </Card>

      {/* Stays in view while scrolling through the themes. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-1">
          <p className="min-w-0 truncate text-sm text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {theme.name}
            </span>{" "}
            · {accent.name}
            {!changed && " (saved)"}
          </p>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/${shopSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                className: "hidden sm:inline-flex",
              })}
            >
              View shop
            </Link>
            <Button type="button" onClick={save} disabled={pending || !changed}>
              {pending ? "Saving..." : "Save theme"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
