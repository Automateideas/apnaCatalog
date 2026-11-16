"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { updateTheme } from "@/app/actions/shop";
import { getBusinessType } from "@/lib/catalog-config";
import { getTheme, THEMES, typesForTheme } from "@/lib/themes";
import { cx } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemePreview } from "./ThemePreview";

export function ThemeForm({
  initial,
  paid,
  shopName,
  shopSlug,
  recommended,
}: {
  initial: { theme: string; accent: string; hideBranding: boolean };
  paid: boolean;
  shopName: string;
  shopSlug: string;
  /** The theme made for this shop's business type. */
  recommended: string;
}) {
  const router = useRouter();
  const [themeId, setThemeId] = useState(initial.theme);
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
          Each theme has its own fonts, shapes, header and item layout. All themes are free.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((t) => {
            const selected = t.id === theme.id;
            const bestFor = typesForTheme(t.id).map((id) => getBusinessType(id).name);
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
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{t.name}</span>
                    {t.id === recommended && <Badge variant="secondary">For your shop</Badge>}
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
