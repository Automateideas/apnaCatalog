"use client";

import { useMemo, useState, useTransition } from "react";
import { createOrder } from "@/app/actions/orders";
import type { ItemStyle, Theme } from "@/lib/themes";
import { useStored } from "@/lib/use-stored";
import { cartKey, formatPriceRange, type ItemDetail, type ItemOption, itemPriceSpan, parseCartKey } from "@/lib/item-options";
import { listingPrice, unavailableLabel } from "@/lib/property";
import { cx, formatPrice, siteUrl, waLink } from "@/lib/utils";
import { Icon } from "@/components/Icon";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ReportButton } from "@/components/ReportButton";
import { ItemCarousel } from "./ItemCarousel";
import { PhotoViewer } from "./PhotoViewer";

export type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  mrp: number | null;
  maxPrice: number | null;
  options: ItemOption[];
  /** Property listings: "sale" or "rent". */
  listing: string | null;
  details: ItemDetail[];
  unit: string | null;
  imageUrl: string | null;
  /** All photos, main photo first. */
  imageUrls: string[];
  inStock: boolean;
  categoryId: string | null;
};

export type CatalogCategory = { id: string; name: string; parentId: string | null };

type Props = {
  shop: { id: string; name: string; slug: string; whatsapp: string };
  /** "enquiry" (property dealers): each item has a WhatsApp enquiry button and there is no cart. */
  mode?: "cart" | "enquiry";
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

export function Catalog({ shop, look, items, categories, mode = "cart" }: Props) {
  const enquiry = mode === "enquiry";
  const pageOf = (item: CatalogItem) => `${siteUrl()}/${shop.slug}/i/${item.id}`;
  /** WhatsApp message to the shop about one listing. */
  const enquire = (item: CatalogItem) =>
    waLink(shop.whatsapp, `Hi ${shop.name}, I am interested in: ${item.name} (${listingPrice(item)}).\n${pageOf(item)}`);
  /** "2 BHK · 1,150 sq ft · Raj Nagar": the first few facts of a listing. */
  const summary = (item: CatalogItem) =>
    item.details
      .filter((d) => ["BHK", "Area", "Locality"].includes(d.label))
      .map((d) => d.value)
      .join(" · ");
  const layout = look.items;
  const [rawCart, setRawCart] = useStored(`ac-cart-${shop.id}`);
  const [rawLast, setRawLast] = useStored(`ac-last-order-${shop.id}`);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [viewing, setViewing] = useState<{ item: CatalogItem; start: number } | null>(null);
  // The item whose details are open (tapping a card).
  const [detail, setDetail] = useState<CatalogItem | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Drop cart entries for items (or options) that were removed or went out of stock.
  const cart = useMemo(() => {
    const parsed = parseCart(rawCart);
    const valid: Cart = {};
    for (const [key, qty] of Object.entries(parsed)) {
      const { itemId, optionId } = parseCartKey(key);
      const item = itemById.get(itemId);
      if (!item?.inStock) continue;
      const ok = optionId ? item.options.some((o) => o.id === optionId) : item.options.length === 0;
      if (ok) valid[key] = qty;
    }
    return valid;
  }, [rawCart, itemById]);

  // The item being added when it has options (the option picker is open).
  const [choosing, setChoosing] = useState<CatalogItem | null>(null);

  const setQty = (key: string, qty: number) => {
    const next = { ...cart };
    if (qty <= 0) delete next[key];
    else next[key] = Math.min(qty, 999);
    setRawCart(Object.keys(next).length ? JSON.stringify(next) : null);
    setError(null);
  };

  const cartLines = Object.entries(cart).map(([key, qty]) => {
    const { itemId, optionId } = parseCartKey(key);
    const item = itemById.get(itemId)!;
    const option = optionId ? (item.options.find((o) => o.id === optionId) ?? null) : null;
    const unitPrice = option ? option.price : item.price;
    const unitMax = Math.max(unitPrice, (option ? option.maxPrice : item.maxPrice) ?? 0);
    return { key, item, option, qty, unitPrice, unitMax };
  });
  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);
  const cartTotal = cartLines.reduce((n, l) => n + l.qty * l.unitPrice, 0);
  const cartMax = cartLines.reduce((n, l) => n + l.qty * l.unitMax, 0);
  /** How many of an item are in the cart, across its options. */
  const qtyOfItem = (item: CatalogItem) =>
    cartLines.filter((l) => l.item.id === item.id).reduce((n, l) => n + l.qty, 0);

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
          lines: cartLines.map((l) => ({ itemId: l.item.id, optionId: l.option?.id, qty: l.qty })),
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
    if (enquiry) {
      if (!item.inStock) {
        return <span className="text-sm font-semibold text-(--t-muted)">{unavailableLabel(item.listing)}</span>;
      }
      return (
        <a
          href={enquire(item)}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(
            "t-btn inline-flex items-center justify-center gap-1.5 border border-(--pa) font-semibold text-(--pa) hover:bg-(--ps)",
            compact ? "px-3 py-1 text-sm" : "w-full py-1.5 text-sm",
          )}
          aria-label={`Enquire about ${item.name} on WhatsApp`}
        >
          Enquire
        </a>
      );
    }
    if (!item.inStock) {
      return <span className="text-xs font-medium text-(--t-muted)">Out of stock</span>;
    }
    // An item with options opens the picker, where each option has its own count.
    if (item.options.length > 0) {
      const inCart = qtyOfItem(item);
      return (
        <button
          type="button"
          onClick={() => setChoosing(item)}
          className={cx(
            "t-btn border font-semibold",
            inCart > 0 ? "border-(--p) bg-(--p) text-(--pt)" : "border-(--pa) text-(--pa) hover:bg-(--ps)",
            compact ? "px-3 py-1 text-sm" : "w-full py-1.5 text-sm",
          )}
          aria-label={`Choose an option of ${item.name}`}
        >
          {inCart > 0 ? `${inCart} added · Edit` : "Add +"}
        </button>
      );
    }
    return qtyControl(item.id, item.name, compact);
  };

  /** Add button, then − count + for one cart entry (an item, or one option of it). */
  const qtyControl = (key: string, label: string, compact = false) => {
    const qty = cart[key] ?? 0;
    if (qty === 0) {
      return (
        <button
          type="button"
          onClick={() => setQty(key, 1)}
          className={cx(
            "t-btn border border-(--pa) font-semibold text-(--pa) hover:bg-(--ps)",
            compact ? "px-3 py-1 text-sm" : "w-full py-1.5 text-sm",
          )}
          aria-label={`Add ${label}`}
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
          onClick={() => setQty(key, qty - 1)}
          className="h-8 w-8 text-lg font-bold"
          aria-label={`Remove one ${label}`}
        >
          −
        </button>
        <span className="min-w-6 text-center text-sm font-semibold" aria-live="polite">
          {qty}
        </span>
        <button
          type="button"
          onClick={() => setQty(key, qty + 1)}
          className="h-8 w-8 text-lg font-bold"
          aria-label={`Add one more ${label}`}
        >
          +
        </button>
      </div>
    );
  };

  const price = (item: CatalogItem) => (
    <span className="whitespace-nowrap">
      <span className="font-semibold text-(--t-text)">
        {enquiry
          ? listingPrice(item)
          : (() => {
              const { min, max } = itemPriceSpan(item);
              return formatPriceRange(min, max);
            })()}
      </span>
      {item.mrp && item.mrp > item.price && item.options.length === 0 && !item.maxPrice && (
        <span className="ml-1.5 text-xs text-(--t-muted) line-through">{formatPrice(item.mrp)}</span>
      )}
    </span>
  );

  /** An item's main photo. Tapping it opens all of the item's photos. */
  /** Photos of an item. Big cards slide through all of them; small ones show the first. */
  const photo = (item: CatalogItem, className: string, slide = false) =>
    slide && item.imageUrls.length > 1 ? (
      <ItemCarousel urls={item.imageUrls} name={item.name} onOpen={() => setDetail(item)} className={className} />
    ) : (
      <button
        type="button"
        onClick={() => setDetail(item)}
        className={cx("relative block cursor-pointer", className)}
        aria-label={`Open ${item.name}`}
      >
        <img src={item.imageUrl ?? ""} alt="" loading="lazy" className="h-full w-full object-cover" />
        {item.imageUrls.length > 1 && (
          <span className="absolute right-1 bottom-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {item.imageUrls.length} photos
          </span>
        )}
      </button>
    );

  /** An item's name, as the button that opens its details. */
  const title = (item: CatalogItem, className: string) => (
    <>
      {enquiry && item.listing && (
        <span className="mb-0.5 inline-block rounded-full bg-(--ps) px-2 py-0.5 text-[11px] font-semibold text-(--pa)">
          {item.listing === "rent" ? "For rent" : "For sale"}
        </span>
      )}
      <h3 className={className}>
        <button type="button" onClick={() => setDetail(item)} className="text-left hover:underline">
          {item.name}
        </button>
      </h3>
      {enquiry && summary(item) && <p className="truncate text-xs text-(--t-muted)">{summary(item)}</p>}
    </>
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
                {item.imageUrl ? photo(item, "h-full w-full", true) : noPhoto("h-8 w-8")}
              </div>
              <div className={cx("flex flex-1 flex-col", tall ? "pt-2.5" : "p-2.5")}>
                {title(item, cx("line-clamp-2 text-sm font-medium text-(--t-text)", tall && "t-head text-base"))}
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
                {title(item, "truncate text-sm font-medium text-(--t-text)")}
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
                {title(item, "t-head text-[1.05rem] text-(--t-text)")}
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
        items.length === 0 ? (
          <div className="t-card mt-3 flex flex-col items-center px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-(--ps) text-(--pa)">
              <Icon name="box" className="size-7" />
            </span>
            <p className="t-head mt-4 text-lg text-(--t-text)">Catalog coming soon</p>
            <p className="mt-1 max-w-xs text-sm text-(--t-muted)">
              {shop.name} is adding items. Message them on WhatsApp to ask what is available today.
            </p>
          </div>
        ) : (
          <p className="t-card mt-3 px-4 py-10 text-center text-(--t-muted)">No items found.</p>
        )
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
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
            <div>
              <p className="text-sm text-(--t-muted)">
                {cartCount} {cartCount === 1 ? "item" : "items"}
              </p>
              <p className="text-lg font-bold text-(--t-text)">{formatPriceRange(cartTotal, cartMax)}</p>
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
                {cartLines.map(({ key, item, option, qty, unitPrice, unitMax }) => (
                  <li key={key} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-(--t-text)">
                        {item.name}
                        {option && <span className="text-(--t-muted)"> ({option.name})</span>}
                      </p>
                      <p className="text-xs text-(--t-muted)">
                        {formatPriceRange(unitPrice, unitMax)} × {qty} ={" "}
                        <span className="font-semibold text-(--t-text)">
                          {formatPriceRange(unitPrice * qty, unitMax * qty)}
                        </span>
                      </p>
                    </div>
                    {qtyControl(key, option ? `${item.name} (${option.name})` : item.name, true)}
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
                  <span className="text-xl font-bold">{formatPriceRange(cartTotal, cartMax)}</span>
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

      {choosing && (
        <Sheet open onOpenChange={(open) => !open && setChoosing(null)}>
          <SheetContent side="bottom" showCloseButton={false} className="t-page mx-auto max-h-[80dvh] w-full max-w-lg gap-0 rounded-t-2xl bg-(--t-surface) p-0 text-base">
            <div className="flex items-center justify-between border-b border-(--t-border) px-5 py-3">
              <SheetTitle className="t-head truncate text-lg text-(--t-text)">{choosing.name}</SheetTitle>
              <SheetClose
                render={<Button variant="ghost" size="icon" className="text-(--t-muted)" aria-label="Close" />}
              >
                <Icon name="x" />
              </SheetClose>
            </div>
            <ul className="flex-1 divide-y divide-(--t-border) overflow-y-auto px-5">
              {choosing.options.map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-(--t-text)">{o.name}</p>
                    <p className="text-sm text-(--t-muted)">
                      {formatPriceRange(o.price, o.maxPrice)}
                      {choosing.unit && ` / ${choosing.unit}`}
                    </p>
                  </div>
                  {qtyControl(cartKey(choosing.id, o.id), `${choosing.name} (${o.name})`, true)}
                </li>
              ))}
            </ul>
            <div className="border-t border-(--t-border) px-5 py-3">
              <Button
                type="button"
                onClick={() => setChoosing(null)}
                className="t-btn w-full bg-(--p) text-(--pt) hover:bg-(--pd)"
              >
                Done
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {detail && (
        <Dialog open onOpenChange={(open) => !open && setDetail(null)}>
          <DialogContent className="t-page max-h-[92dvh] gap-0 overflow-y-auto bg-(--t-surface) p-0 sm:max-w-md">
            {detail.imageUrls.length > 0 && (
              <div className="aspect-square w-full overflow-hidden bg-(--ps)">
                <ItemCarousel
                  urls={detail.imageUrls}
                  name={detail.name}
                  onOpen={(i) => setViewing({ item: detail, start: i })}
                />
              </div>
            )}
            <div className="space-y-3 p-5">
              <div>
                <DialogTitle className="t-head text-xl text-(--t-text)">{detail.name}</DialogTitle>
                <p className="mt-1 text-lg">
                  {price(detail)}
                  {detail.unit && <span className="ml-1.5 text-sm text-(--t-muted)">/ {detail.unit}</span>}
                </p>
              </div>
              {detail.description ? (
                <DialogDescription className="text-sm whitespace-pre-line text-(--t-text) opacity-90">
                  {detail.description}
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">Price and options of {detail.name}</DialogDescription>
              )}
              {enquiry && detail.details.length > 0 && (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-(--t-radius) border border-(--t-border) p-3 text-sm">
                  {detail.details.map((d) => (
                    <div key={d.label}>
                      <dt className="text-xs text-(--t-muted)">{d.label}</dt>
                      <dd className="font-medium text-(--t-text)">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {enquiry ? (
                <div className="space-y-2">
                  {detail.inStock ? (
                    <a
                      href={enquire(detail)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: "whatsapp", className: "w-full text-base" })}
                    >
                      Enquire on WhatsApp
                    </a>
                  ) : (
                    <p className="font-semibold text-(--t-muted)">{unavailableLabel(detail.listing)}</p>
                  )}
                  <a href={pageOf(detail)} className="block text-center text-sm text-(--t-muted) underline">
                    Open this listing&apos;s page to share it
                  </a>
                </div>
              ) : !detail.inStock ? (
                <p className="font-medium text-(--t-muted)">Out of stock</p>
              ) : detail.options.length > 0 ? (
                <ul className="divide-y divide-(--t-border) rounded-(--t-radius) border border-(--t-border)">
                  {detail.options.map((o) => (
                    <li key={o.id} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-(--t-text)">{o.name}</p>
                        <p className="text-sm text-(--t-muted)">{formatPriceRange(o.price, o.maxPrice)}</p>
                      </div>
                      {qtyControl(cartKey(detail.id, o.id), `${detail.name} (${o.name})`, true)}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="max-w-40">{qtyControl(detail.id, detail.name)}</div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setDetail(null)}
                className="t-btn w-full border-(--t-border)"
              >
                {cartCount > 0 ? "Continue shopping" : "Close"}
              </Button>
              <div className="text-center">
                <ReportButton shopId={shop.id} itemId={detail.id} what="item" />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {viewing && (
        <PhotoViewer
          name={viewing.item.name}
          urls={viewing.item.imageUrls.length > 0 ? viewing.item.imageUrls : [viewing.item.imageUrl ?? ""]}
          start={viewing.start}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
