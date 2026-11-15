"use client";

import { useMemo, useState, useTransition } from "react";
import { createOrder } from "@/app/actions/orders";
import type { LayoutId } from "@/lib/catalog-config";
import { useStored } from "@/lib/use-stored";
import { cx, formatPrice } from "@/lib/utils";
import { Icon } from "@/components/Icon";

export type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  mrp: number | null;
  unit: string | null;
  imageUrl: string | null;
  inStock: boolean;
  categoryId: string | null;
};

export type CatalogCategory = { id: string; name: string; parentId: string | null };

type Props = {
  shop: { id: string; name: string };
  layout: LayoutId;
  items: CatalogItem[];
  categories: CatalogCategory[];
};

type Cart = Record<string, number>;

function parseCart(raw: string | null): Cart {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object") return {};
    const cart: Cart = {};
    for (const [id, qty] of Object.entries(value as Record<string, unknown>)) {
      if (typeof qty === "number" && Number.isInteger(qty) && qty > 0 && qty < 1000) cart[id] = qty;
    }
    return cart;
  } catch {
    return {};
  }
}

export function Catalog({ shop, layout, items, categories }: Props) {
  const [rawCart, setRawCart] = useStored(`ac-cart-${shop.id}`);
  const [rawLast, setRawLast] = useStored(`ac-last-order-${shop.id}`);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Drop cart entries for items that were removed or went out of stock.
  const cart = useMemo(() => {
    const parsed = parseCart(rawCart);
    const valid: Cart = {};
    for (const [id, qty] of Object.entries(parsed)) {
      if (itemById.get(id)?.inStock) valid[id] = qty;
    }
    return valid;
  }, [rawCart, itemById]);

  const setQty = (id: string, qty: number) => {
    const next = { ...cart };
    if (qty <= 0) delete next[id];
    else next[id] = Math.min(qty, 999);
    setRawCart(Object.keys(next).length ? JSON.stringify(next) : null);
    setError(null);
  };

  const cartLines = Object.entries(cart).map(([id, qty]) => ({ item: itemById.get(id)!, qty }));
  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);
  const cartTotal = cartLines.reduce((n, l) => n + l.qty * l.item.price, 0);

  const topOf = (item: CatalogItem): string | null => {
    const cat = item.categoryId ? catById.get(item.categoryId) : undefined;
    return cat ? (cat.parentId ?? cat.id) : null;
  };

  const usedTop = new Set(items.map(topOf));
  const topCats = categories.filter((c) => !c.parentId && usedTop.has(c.id));
  const usedSubs = new Set(items.map((i) => i.categoryId));
  const subCats =
    activeCat === "all"
      ? []
      : categories.filter((c) => c.parentId === activeCat && usedSubs.has(c.id));

  const q = query.trim().toLowerCase();
  const visible = items.filter((item) => {
    if (q && !`${item.name} ${item.description ?? ""}`.toLowerCase().includes(q)) return false;
    if (activeCat !== "all" && topOf(item) !== activeCat) return false;
    if (activeSub && item.categoryId !== activeSub) return false;
    return true;
  });

  const sections: { title: string | null; items: CatalogItem[] }[] =
    activeCat === "all" && !q && topCats.length > 0
      ? [
          ...topCats.map((c) => ({
            title: c.name,
            items: visible.filter((i) => topOf(i) === c.id),
          })),
          { title: "More items", items: visible.filter((i) => topOf(i) === null) },
        ].filter((s) => s.items.length > 0)
      : [{ title: null, items: visible }];

  const sendOrder = () => {
    setError(null);
    startSending(async () => {
      try {
        const result = await createOrder({
          shopId: shop.id,
          lines: cartLines.map((l) => ({ itemId: l.item.id, qty: l.qty })),
          name: name.trim() || undefined,
          note: note.trim() || undefined,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setRawLast(result.data.id);
        setRawCart(null);
        setCartOpen(false);
        window.location.href = result.data.whatsappUrl;
      } catch {
        setError("Could not send the order. Check your internet and try again.");
      }
    });
  };

  const stepper = (item: CatalogItem, compact = false) => {
    if (!item.inStock) {
      return <span className="text-xs font-medium text-slate-400">Out of stock</span>;
    }
    const qty = cart[item.id] ?? 0;
    if (qty === 0) {
      return (
        <button
          type="button"
          onClick={() => setQty(item.id, 1)}
          className={cx(
            "rounded-lg border border-(--p) font-semibold text-(--p) hover:bg-(--ps)",
            compact ? "px-3 py-1 text-sm" : "w-full py-1.5 text-sm",
          )}
          aria-label={`Add ${item.name}`}
        >
          Add +
        </button>
      );
    }
    return (
      <div
        className={cx(
          "flex items-center justify-between rounded-lg bg-(--p) text-white",
          compact ? "w-24" : "w-full",
        )}
      >
        <button
          type="button"
          onClick={() => setQty(item.id, qty - 1)}
          className="h-8 w-8 text-lg font-bold"
          aria-label={`Remove one ${item.name}`}
        >
          −
        </button>
        <span className="min-w-6 text-center text-sm font-semibold" aria-live="polite">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty(item.id, qty + 1)}
          className="h-8 w-8 text-lg font-bold"
          aria-label={`Add one more ${item.name}`}
        >
          +
        </button>
      </div>
    );
  };

  const price = (item: CatalogItem) => (
    <span className="whitespace-nowrap">
      <span className="font-semibold text-slate-900">{formatPrice(item.price)}</span>
      {item.mrp && item.mrp > item.price && (
        <span className="ml-1.5 text-xs text-slate-400 line-through">{formatPrice(item.mrp)}</span>
      )}
    </span>
  );

  const renderItems = (list: CatalogItem[]) => {
    if (layout === "grid") {
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((item) => (
            <article
              key={item.id}
              className={cx("card flex flex-col overflow-hidden", !item.inStock && "opacity-60")}
            >
              <div className="aspect-square bg-slate-100">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <Icon name="bag" className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-2.5">
                <h3 className="line-clamp-2 text-sm font-medium text-slate-900">{item.name}</h3>
                {item.unit && <p className="text-xs text-slate-500">{item.unit}</p>}
                <div className="mt-1 text-sm">
                  {price(item)}
                </div>
                <div className="mt-auto pt-2">
                  {stepper(item)}
                </div>
              </div>
            </article>
          ))}
        </div>
      );
    }

    if (layout === "list") {
      return (
        <div className="card divide-y divide-slate-100">
          {list.map((item) => (
            <article
              key={item.id}
              className={cx("flex items-center gap-3 p-3", !item.inStock && "opacity-60")}
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <Icon name="bag" className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-slate-900">{item.name}</h3>
                <p className="text-sm">
                  {price(item)}
                  {item.unit && <span className="ml-1.5 text-xs text-slate-500">/ {item.unit}</span>}
                </p>
              </div>
              {stepper(item, true)}
            </article>
          ))}
        </div>
      );
    }

    return (
      <div className="card divide-y divide-dashed divide-slate-200 px-4">
        {list.map((item) => (
          <article key={item.id} className={cx("flex gap-3 py-3.5", !item.inStock && "opacity-60")}>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <h3 className="font-medium text-slate-900">{item.name}</h3>
                <span className="mb-1 hidden flex-1 border-b border-dotted border-slate-300 sm:block" />
                {price(item)}
              </div>
              {(item.description || item.unit) && (
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">
                  {[item.unit, item.description].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="mt-2">
                {stepper(item, true)}
              </div>
            </div>
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt={item.name}
                loading="lazy"
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />
            )}
          </article>
        ))}
      </div>
    );
  };

  const chip = (active: boolean) =>
    cx(
      "rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap",
      active
        ? "border-(--p) bg-(--p) text-white"
        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
    );

  return (
    <div className={cartCount > 0 ? "pb-24" : ""}>
      {rawLast && cartCount === 0 && (
        <div className="ok-text mb-4 flex flex-wrap items-center justify-between gap-2">
          <span>Your order was sent to the shop on WhatsApp.</span>
          <span className="flex gap-3">
            <a href={`/o/${rawLast}`} className="font-semibold underline">
              View / save as PDF
            </a>
            <button type="button" onClick={() => setRawLast(null)} className="text-emerald-700">
              Dismiss
            </button>
          </span>
        </div>
      )}

      {items.length > 6 && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items"
          aria-label="Search items"
          className="input mb-3"
        />
      )}

      {topCats.length > 1 && (
        <nav
          aria-label="Categories"
          className="no-scrollbar sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto bg-slate-50/95 px-4 py-2 backdrop-blur"
        >
          <button
            type="button"
            className={chip(activeCat === "all")}
            onClick={() => {
              setActiveCat("all");
              setActiveSub(null);
            }}
          >
            All
          </button>
          {topCats.map((c) => (
            <button
              key={c.id}
              type="button"
              className={chip(activeCat === c.id)}
              onClick={() => {
                setActiveCat(c.id);
                setActiveSub(null);
              }}
            >
              {c.name}
            </button>
          ))}
        </nav>
      )}

      {subCats.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {[{ id: null as string | null, name: "All" }, ...subCats].map((c) => (
            <button
              key={c.id ?? "all"}
              type="button"
              onClick={() => setActiveSub(c.id)}
              className={cx(
                "rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap",
                activeSub === c.id ? "bg-(--ps) text-(--pd)" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="card mt-3 px-4 py-10 text-center text-slate-500">
          {items.length === 0 ? "This shop has not added items yet." : "No items found."}
        </p>
      ) : (
        sections.map((section) => (
          <section key={section.title ?? "all"} className="mt-4">
            {section.title && (
              <h2 className="mb-2 text-base font-bold text-slate-900">{section.title}</h2>
            )}
            {renderItems(section.items)}
          </section>
        ))
      )}

      {cartCount > 0 && !cartOpen && (
        <div className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-600">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </p>
              <p className="text-lg font-bold text-slate-900">{formatPrice(cartTotal)}</p>
            </div>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="btn bg-(--p) px-6 text-white hover:bg-(--pd)"
            >
              View cart
            </button>
          </div>
        </div>
      )}

      {cartOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Your cart"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCartOpen(false);
          }}
        >
          <div className="flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold">Your cart</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close cart"
              >
                <Icon name="x" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {cartLines.length === 0 && <p className="py-6 text-center text-slate-500">Your cart is empty.</p>}
              <ul className="divide-y divide-slate-100">
                {cartLines.map(({ item, qty }) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatPrice(item.price)} × {qty} ={" "}
                        <span className="font-semibold text-slate-800">
                          {formatPrice(item.price * qty)}
                        </span>
                      </p>
                    </div>
                    {stepper(item, true)}
                  </li>
                ))}
              </ul>

              {cartLines.length > 0 && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="label" htmlFor="cart-name">
                      Your name (optional)
                    </label>
                    <input
                      id="cart-name"
                      className="input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={60}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="cart-note">
                      Note for the shop (optional)
                    </label>
                    <textarea
                      id="cart-note"
                      className="input"
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={300}
                      placeholder="Colour, size, delivery address..."
                    />
                  </div>
                </div>
              )}
            </div>

            {cartLines.length > 0 && (
              <div className="border-t border-slate-100 px-5 py-4">
                {error && <p className="error-text mb-3">{error}</p>}
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-slate-600">Total</span>
                  <span className="text-xl font-bold">{formatPrice(cartTotal)}</span>
                </div>
                <button
                  type="button"
                  onClick={sendOrder}
                  disabled={sending}
                  className="btn-whatsapp w-full text-base"
                >
                  {sending ? "Opening WhatsApp..." : "Send order on WhatsApp"}
                </button>
                <p className="mt-2 text-center text-xs text-slate-500">
                  No payment now. {shop.name} will confirm the final price and availability on
                  WhatsApp.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
