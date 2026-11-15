"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateTheme } from "@/app/actions/shop";
import { LAYOUTS, PALETTES, type LayoutId } from "@/lib/catalog-config";
import { cx } from "@/lib/utils";
import { Icon } from "@/components/Icon";

export function ThemeForm({
  initial,
  paid,
  freeLayout,
  freePalettes,
}: {
  initial: { layout: string; palette: string; hideBranding: boolean };
  paid: boolean;
  freeLayout: LayoutId;
  freePalettes: string[];
}) {
  const router = useRouter();
  const [layout, setLayout] = useState(initial.layout);
  const [palette, setPalette] = useState(initial.palette);
  const [hideBranding, setHideBranding] = useState(initial.hideBranding);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const result = await updateTheme({ layout, palette, hideBranding });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setSaved(true);
        router.refresh();
      } catch {
        setError("Could not save. Check your internet and try again.");
      }
    });
  };

  const lock = (
    <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-medium text-amber-700">
      <Icon name="lock" className="h-3 w-3" /> Paid
    </span>
  );

  return (
    <div className="space-y-5">
      {!paid && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The free plan has 1 layout and 2 colours.{" "}
          <Link href="/dashboard/plan" className="font-semibold underline">
            Upgrade to unlock all themes
          </Link>
        </p>
      )}

      <section className="card p-5">
        <h2 className="font-bold text-slate-900">Layout</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(Object.keys(LAYOUTS) as LayoutId[]).map((id) => {
            const locked = !paid && id !== freeLayout;
            return (
              <button
                key={id}
                type="button"
                disabled={locked}
                aria-pressed={layout === id}
                onClick={() => {
                  setLayout(id);
                  setSaved(false);
                }}
                className={cx(
                  "rounded-2xl border-2 p-4 text-left transition",
                  layout === id ? "border-brand bg-brand-soft" : "border-slate-200 bg-white",
                  locked ? "cursor-not-allowed opacity-60" : "hover:border-slate-300",
                )}
              >
                <span className="font-semibold text-slate-900">{LAYOUTS[id].name}</span>
                {locked && lock}
                <span className="mt-1 block text-sm text-slate-600">{LAYOUTS[id].hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="font-bold text-slate-900">Colour</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(PALETTES).map(([id, p]) => {
            const locked = !paid && !freePalettes.includes(id);
            return (
              <button
                key={id}
                type="button"
                disabled={locked}
                aria-pressed={palette === id}
                onClick={() => {
                  setPalette(id);
                  setSaved(false);
                }}
                className={cx(
                  "flex items-center gap-2 rounded-2xl border-2 p-3 text-left transition",
                  palette === id ? "border-slate-900" : "border-slate-200",
                  locked ? "cursor-not-allowed opacity-50" : "hover:border-slate-400",
                )}
              >
                <span className="h-8 w-8 shrink-0 rounded-full" style={{ background: p.primary }} />
                <span className="text-sm font-medium text-slate-900">
                  {p.name}
                  {locked && lock}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <label
          className={cx(
            "flex items-start gap-3 text-sm",
            !paid && "cursor-not-allowed opacity-60",
          )}
        >
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 accent-[#1e3fae]"
            disabled={!paid}
            checked={hideBranding}
            onChange={(e) => {
              setHideBranding(e.target.checked);
              setSaved(false);
            }}
          />
          <span>
            <span className="font-semibold text-slate-900">
              Hide &quot;Made with Apnacatalog&quot; on my shop page
            </span>
            {!paid && lock}
          </span>
        </label>
      </section>

      {error && <p className="error-text">{error}</p>}
      {saved && <p className="ok-text">Theme saved. Open your shop to see it.</p>}

      <button type="button" className="btn-primary w-full text-base sm:w-auto" onClick={save} disabled={pending}>
        {pending ? "Saving..." : "Save theme"}
      </button>
    </div>
  );
}
