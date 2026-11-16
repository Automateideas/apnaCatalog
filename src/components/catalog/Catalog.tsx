"use client";

import { useMemo, useState, useTransition } from "react";
import { createOrder } from "@/app/actions/orders";
import type { ItemStyle, Theme } from "@/lib/themes";
import { useStored } from "@/lib/use-stored";
import { cx, formatPrice } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { PhotoViewer } from "./PhotoViewer";

export type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  mrp: number | null;
  unit: string | null;
  imageUrl: string | null;
  /** All photos, main photo first. */
  imageUrls: string[];
  inStock: boolean;
  categoryId: string | null;
};

export type CatalogCategory = { id: string; name: string; parentId: string | null };

type Props = {
  shop: { id: string; name: string };
  /** Layout choices of the shop's theme. Colours and shapes come from CSS variables. */
  look: { items: ItemStyle; center: boolean; chips: Theme["chips"] };
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

export function Catalog({ shop, look, items, categories }: Props) {
  const layout = look.items;
  const [rawCart, setRawCart] = useStored(`ac-cart-${shop.id}`);
  const [rawLast, setRawLast] = useStored(`ac-last-order-${shop.id}`);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [viewing, setViewing] = useState<CatalogItem | null>(null);
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
      return <span className="text-xs font-medium text-(--t-muted)">Out of stock</span>;
    }
    const qty = cart[item.id] ?? 0;
    if (qty === 0) {
      return (
        <button
          type="button"
          onClick={() => setQty(item.id, 1)}
          className={cx(
            "t-btn border border-(--pa) font-semibold text-(--pa) hover:bg-(--ps)",
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
          "t-btn flex items-center justify-between bg-(--p) text-(--pt)",
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
      <span className="font-semibold text-(--t-text)">{formatPrice(item.price)}</span>
      {item.mrp && item.mrp > item.price && (
        <span className="ml-1.5 text-xs text-(--t-muted) line-through">{formatPrice(item.mrp)}</span>
      )}
    </span>
  );

  /** An item's main photo. Tapping it opens all of the item's photos. */
  const photo = (item: CatalogItem, className: string) => (
    <button
      type="button"
      onClick={() => setViewing(item)}
      className={cx("relative block cursor-zoom-in", className)}
      aria-label={
        item.imageUrls.length > 1
          ? `View ${item.imageUrls.length} photos of ${item.name}`
          : `View photo of ${item.name}`
      }
    >
      <img src={item.imageUrl ?? ""} alt="" loading="lazy" className="h-full w-full object-cover" />
      {item.imageUrls.length > 1 && (
        <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {item.imageUrls.length} photos
        </span>
      )}
    </button>
  );

  const noPhoto = (size: string) => (
    <div className="flex h-full items-center justify-center bg-(--ps) text-(--pa) opacity-70">
      <Icon name="bag" className={size} />
    </div>
  );

  const renderItems = (list: CatalogItem[]) => {
    if (layout === "grid" || layout === "portrait") {
      const tall = layout === "portrait";
      return (
        <div
          className={cx(
            "grid",
            tall ? "grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3" : "grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
          )}
        >
          {list.map((item) => (
            <article
              key={item.id}
              className={cx(
                "flex flex-col",
                // Portrait themes show the photo on its own, like a fashion catalogue.
                !tall && "t-card overflow-hidden",
                look.center && "text-center",
                !item.inStock && "opacity-60",
              )}
            >
              <div className={cx(tall ? "t-photo aspect-[3/4]" : "aspect-square", "bg-(--ps)")}>
                {item.imageUrl ? photo(item, "h-full w-full") : noPhoto("h-8 w-8")}
              </div>
              <div className={cx("flex flex-1 flex-col", tall ? "pt-2.5" : "p-2.5")}>
                <h3 className={cx("line-clamp-2 text-sm font-medium text-(--t-text)", tall && "t-head text-base")}>
                  {item.name}
                </h3>
                {item.unit && <p className="text-xs text-(--t-muted)">{item.unit}</p>}
                <div className="mt-1 text-sm">{price(item)}</div>
                <div className="mt-auto pt-2">{stepper(item)}</div>
              </div>
            </article>
          ))}
        </div>
      );
    }

    if (layout === "list") {
      return (
        <div className="t-card divide-y divide-(--t-border) overflow-hidden">
          {list.map((item) => (
            <article key={item.id} className={cx("flex items-center gap-3 p-3", !item.inStock && "opacity-60")}>
              <div className="t-photo h-14 w-14 shrink-0 bg-(--ps)">
                {item.imageUrl ? photo(item, "h-full w-full") : noPhoto("h-6 w-6")}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-(--t-text)">{item.name}</h3>
                <p className="text-sm">
                  {price(item)}
                  {item.unit && <span className="ml-1.5 text-xs text-(--t-muted)">/ {item.unit}</span>}
                </p>
              </div>
              {stepper(item, true)}
            </article>
          ))}
        </div>
      );
    }

    return (
      <div className="t-card divide-y divide-dashed divide-(--t-border) px-4">
        {list.map((item) => (
          <article key={item.id} className={cx("flex gap-3 py-3.5", !item.inStock && "opacity-60")}>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <h3 className="t-head text-[1.05rem] text-(--t-text)">{item.name}</h3>
                <span className="mb-1 hidden flex-1 border-b border-dotted border-(--t-muted) opacity-60 sm:block" />
                {price(item)}
              </div>
              {(item.description || item.unit) && (
                <p className="mt-0.5 line-clamp-2 text-sm text-(--t-muted)">
                  {[item.unit, item.description].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="mt-2">{stepper(item, true)}</div>
            </div>
            {item.imageUrl && photo(item, "t-photo h-20 w-20 shrink-0")}
          </article>
        ))}
      </div>
    );
  };

  const chip = (active: boolean) =>
    look.chips === "underline"
      ? cx(
          "border-b-2 px-1 py-1.5 text-sm font-medium whitespace-nowrap",
          active ? "border-(--pa) text-(--t-text)" : "border-transparent text-(--t-muted) hover:text-(--t-text)",
        )
      : cx(
          "border px-3 py-1.5 text-sm font-medium whitespace-nowrap",
          look.chips === "square" ? "rounded-sm" : "rounded-full",
          active
            ? "border-(--p) bg-(--p) text-(--pt)"
            : "border-(--t-border) bg-(--t-surface) text-(--t-text) hover:border-(--p)",
        );

  return (
    <div className={cartCount > 0 ? "pb-24" : ""}>
      {rawLast && cartCount === 0 && (
        <Alert variant="success" className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span>Your order was sent to the shop on WhatsApp.</span>
          <span className="flex gap-3">
            <a href={`/o/${rawLast}`} className="font-semibold underline">
              View / save as PDF
            </a>
            <button type="button" onClick={() => setRawLast(null)} className="text-emerald-700">
              Dismiss
            </button>
          </span>
        </Alert>
      )}

      {items.length > 6 && (
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items"
          aria-label="Search items"
          className="mb-3"
        />
      )}

      {topCats.length > 1 && (
        <nav
          aria-label="Categories"
          className={cx(
            "no-scrollbar sticky top-0 z-10 -mx-4 flex overflow-x-auto bg-(--t-bg)/95 px-4 py-2 backdrop-blur",
            look.chips === "underline" ? "gap-4" : "gap-2",
          )}
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
                activeSub === c.id ? "bg-(--ps) text-(--pa)" : "text-(--t-muted) hover:bg-(--ps)",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="t-card mt-3 px-4 py-10 text-center text-(--t-muted)">
          {items.length === 0 ? "This shop has not added items yet." : "No items found."}
        </p>
      ) : (
        sections.map((section) => (
          <section key={section.title ?? "all"} className="mt-4">
            {section.title && (
              <h2 className={cx("t-head mb-2.5 text-lg text-(--t-text)", look.center && "text-center")}>{section.title}</h2>
            )}
            {renderItems(section.items)}
          </section>
        ))
      )}

      {cartCount > 0 && !cartOpen && (
        <div className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-(--t-border) bg-(--t-surface) p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.12)]">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
            <div>
              <p className="text-sm text-(--t-muted)">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </p>
              <p className="text-lg font-bold text-(--t-text)">{formatPrice(cartTotal)}</p>
            </div>
            <Button
              type="button"
              onClick={() => setCartOpen(true)}
              className="t-btn bg-(--p) px-6 text-(--pt) hover:bg-(--pd)"
            >
              View cart
            </Button>
          </div>
        </div>
      )}

      {cartOpen && (
        <Sheet open onOpenChange={(open) => !open && setCartOpen(false)}>
          <SheetContent side="bottom" showCloseButton={false} className="t-page mx-auto max-h-[90dvh] w-full max-w-lg gap-0 rounded-t-2xl bg-(--t-surface) p-0 text-base">
            <div className="flex items-center justify-between border-b border-(--t-border) px-5 py-3">
              <SheetTitle className="t-head text-lg text-(--t-text)">Your cart</SheetTitle>
              <SheetClose
                render={<Button variant="ghost" size="icon" className="text-(--t-muted)" aria-label="Close cart" />}
              >
                <Icon name="x" />
              </SheetClose>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {cartLines.length === 0 && <p className="py-6 text-center text-(--t-muted)">Your cart is empty.</p>}
              <ul className="divide-y divide-(--t-border)">
                {cartLines.map(({ item, qty }) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-(--t-text)">{item.name}</p>
                      <p className="text-xs text-(--t-muted)">
                        {formatPrice(item.price)} × {qty} ={" "}
                        <span className="font-semibold text-(--t-text)">
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
                    <Label htmlFor="cart-name">
                      Your name (optional)
                    </Label>
                    <Input
                      id="cart-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={60}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cart-note">
                      Note for the shop (optional)
                    </Label>
                    <Textarea
                      id="cart-note"
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
              <div className="border-t border-(--t-border) px-5 py-4">
                {error && <Alert variant="destructive" className="mb-3">{error}</Alert>}
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-(--t-muted)">Total</span>
                  <span className="text-xl font-bold">{formatPrice(cartTotal)}</span>
                </div>
                <Button
                  type="button"
                  onClick={sendOrder}
                  disabled={sending}
                  variant="whatsapp" className="w-full text-base"
                >
                  {sending ? "Opening WhatsApp..." : "Send order on WhatsApp"}
                </Button>
                <p className="mt-2 text-center text-xs text-(--t-muted)">
                  No payment now. {shop.name} will confirm the final price and availability on
                  WhatsApp.
                </p>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      {viewing && (
        <PhotoViewer
          name={viewing.name}
          urls={viewing.imageUrls.length > 0 ? viewing.imageUrls : [viewing.imageUrl ?? ""]}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
