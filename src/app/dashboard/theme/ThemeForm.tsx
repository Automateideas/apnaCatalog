"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { updateTheme } from "@/app/actions/shop";
import { getBusinessType } from "@/lib/catalog-config";
import { getTheme, type Level, LEVELS, THEMES, themesForType, typesForTheme } from "@/lib/themes";
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
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [level, setLevel] = useState<Level | "any">("any");
  const businessName = getBusinessType(businessType).name;
  const mine = themesForType(businessType);
  const shown = (scope === "mine" ? mine : [...THEMES].sort((a, b) => levelIndex(a.level) - levelIndex(b.level))).filter(
    (t) => level === "any" || t.level === level,
  );
  const [accentId, setAccentId] = useState(initial.accent);
  const [hideBranding, setHideBranding] = useState(initial.hideBranding);
  const [pending, startTransition] = useTransition();

  const theme = getTheme(themeId) ?? THEMES[0];
  const accent = theme.accents.find((a) => a.id === accentId) ?? theme.accents[0];
  const changed =
    theme.id !== initial.theme || accent.id !== initial.accent || hideBranding !== initial.hideBranding;

  const pickTheme = (id: string) => {
    const next = getTheme(id);
    if (!next) return;
    setThemeId(id);
    // Keep the colour when the new theme has one with the same name, else use its first.
    if (!next.accents.some((a) => a.id === accentId)) setAccentId(next.accents[0].id);
  };

  const save = () => {
    startTransition(async () => {
      try {
        const result = await updateTheme({ theme: theme.id, accent: accent.id, hideBranding });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(`${theme.name} theme saved.`, {
          action: { label: "View shop", onClick: () => window.open(`/${shopSlug}`, "_blank") },
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
        <h2 className="font-bold text-slate-900">Choose a theme</h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Pick the look that matches your prices and customers. Each theme has its own fonts, shapes, header
          and item layout. All themes are free.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-100 p-1" role="group" aria-label="Which themes">
            {(
              [
                ["mine", `For ${businessName} (${mine.length})`],
                ["all", `All themes (${THEMES.length})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={scope === id}
                onClick={() => setScope(id)}
                className={cx(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  scope === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Price level">
            {([{ id: "any", name: "Any price", sign: "" }, ...LEVELS] as const).map((l) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={level === l.id}
                onClick={() => setLevel(l.id)}
                className={cx(
                  "rounded-full border px-3 py-1 text-sm font-medium transition",
                  level === l.id
                    ? "border-brand bg-brand text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
                )}
              >
                {l.sign && <span className="mr-1 opacity-80">{l.sign}</span>}
                {l.name}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
            No {LEVELS.find((l) => l.id === level)?.name.toLowerCase()} themes here.{" "}
            <button type="button" className="font-medium text-brand underline" onClick={() => setScope("all")}>
              See all themes
            </button>
          </p>
        )}

        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => {
            const selected = t.id === theme.id;
            const bestFor = typesForTheme(t.id).map((id) => getBusinessType(id).name);
            const lvl = LEVELS.find((l) => l.id === t.level)!;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={selected}
                onClick={() => pickTheme(t.id)}
                className={cx(
                  "group overflow-hidden rounded-xl border-2 bg-card text-left transition",
                  selected ? "border-brand ring-2 ring-brand/20" : "border-slate-200 hover:border-slate-400",
                )}
              >
                <ThemePreview
                  theme={t}
                  accent={selected ? accent : t.accents[0]}
                  shopName={shopName}
                  className="border-b border-slate-200"
                />
                <div className="p-3">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-slate-900">{t.name}</span>
                    <Badge variant="outline" className="font-semibold" title={`${lvl.name} shops`}>
                      {lvl.sign} {lvl.name}
                    </Badge>
                    {t.id === recommended && <Badge variant="secondary">Default</Badge>}
                    {selected && (
                      <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-brand text-white">
                        <Check className="size-4" />
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600">{t.tagline}</p>
                  {bestFor.length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">Made for: {bestFor.join(", ")}</p>
                  )}
                  {t.header === "cover" && (
                    <p className={cx("mt-1 text-xs", hasShopPhotos ? "text-emerald-700" : "text-amber-700")}>
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
        <h2 className="font-bold text-slate-900">Colour for {theme.name}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {theme.accents.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={a.id === accent.id}
              onClick={() => setAccentId(a.id)}
              className={cx(
                "flex items-center gap-2 rounded-full border-2 py-1.5 pr-3.5 pl-1.5 text-sm font-medium transition",
                a.id === accent.id ? "border-slate-900" : "border-slate-200 hover:border-slate-400",
              )}
            >
              <span
                className="size-7 rounded-full ring-1 ring-black/10"
                style={{ background: theme.dark ? `linear-gradient(135deg, ${theme.colors.bg} 50%, ${a.primary} 50%)` : a.primary }}
              />
              {a.name}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <label className={cx("flex items-start gap-3 text-sm", !paid && "cursor-not-allowed opacity-60")}>
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 accent-[#1b2340]"
            disabled={!paid}
            checked={hideBranding}
            onChange={(e) => setHideBranding(e.target.checked)}
          />
          <span>
            <span className="font-semibold text-slate-900">
              Hide &quot;Made with Apnacatalog&quot; on my shop page
            </span>
            {!paid && (
              <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                <Icon name="lock" className="h-3 w-3" /> Paid
              </span>
            )}
            {!paid && (
              <Link href="/dashboard/plan" className="mt-0.5 block text-xs text-brand underline">
                See the paid plan
              </Link>
            )}
          </span>
        </label>
      </Card>

      {/* Stays in view while scrolling through the themes. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-1">
          <p className="min-w-0 truncate text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{theme.name}</span> · {accent.name}
            {!changed && " (saved)"}
          </p>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/${shopSlug}`}
              target="_blank"
              className={buttonVariants({ variant: "outline", className: "hidden sm:inline-flex" })}
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
