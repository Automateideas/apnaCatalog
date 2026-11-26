"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { createOrder } from "@/app/actions/orders";
import type { ItemStyle, Theme } from "@/lib/themes";
import { useStored } from "@/lib/use-stored";
import {
  cartKey,
  formatPriceRange,
  type ItemDetail,
  type ItemOption,
  itemPriceSpan,
  parseCartKey,
} from "@/lib/item-options";
import { listingPrice, unavailableLabel } from "@/lib/property";
import { cx, formatPrice, siteUrl, waLink, waShareLink } from "@/lib/utils";
import { Heart, Share2 } from "lucide-react";

import { Icon } from "@/components/Icon";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReportButton } from "@/components/ReportButton";
import Image from "next/image";
import { ItemCarousel } from "./ItemCarousel";
import { PhotoViewer } from "./PhotoViewer";

export type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  mrp: number | null;
  maxPrice: number | null;
  /** Discounted / clearance price in paise. When set, customers pay this instead of `price`. */
  salePrice: number | null;
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
  createdAt: Date | string;
};

export type CatalogCategory = {
  id: string;
  name: string;
  parentId: string | null;
};

type Props = {
  shop: { id: string; name: string; slug: string; whatsapp: string };
  /** "enquiry" (property dealers): each item has a WhatsApp enquiry button and there is no cart. */
  mode?: "cart" | "enquiry";
  /** Layout choices of the shop's theme. Colours and shapes come from CSS variables. */
  look: { items: ItemStyle; center: boolean; chips: Theme["chips"] };
  items: CatalogItem[];
  categories: CatalogCategory[];
  serverNow?: number;
};

type Cart = Record<string, number>;

function parseCart(raw: string | null): Cart {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object") return {};
    const cart: Cart = {};
    for (const [id, qty] of Object.entries(value as Record<string, unknown>)) {
      if (
        typeof qty === "number" &&
        Number.isInteger(qty) &&
        qty > 0 &&
        qty < 1000
      )
        cart[id] = qty;
    }
    return cart;
  } catch {
    return {};
  }
}

export function Catalog({
  shop,
  look,
  items,
  categories,
  mode = "cart",
  serverNow,
}: Props) {
  const enquiry = mode === "enquiry";
  const pageOf = (item: CatalogItem) =>
    `${siteUrl()}/${shop.slug}/i/${item.id}`;
  /** WhatsApp message to the shop about one listing. */
  const enquire = (item: CatalogItem) =>
    waLink(
      shop.whatsapp,
      `Hi ${shop.name}, I am interested in: ${item.name} (${listingPrice(item)}).\n${pageOf(item)}`,
    );
  /** "2 BHK · 1,150 sq ft · Raj Nagar": the first few facts of a listing. */
  const summary = (item: CatalogItem) =>
    item.details
      .filter((d) => ["BHK", "Area", "Locality"].includes(d.label))
      .map((d) => d.value)
      .join(" · ");
  const layout = look.items;
  const [rawCart, setRawCart] = useStored(`ac-cart-${shop.id}`);
  const [rawLast, setRawLast] = useStored(`ac-last-order-${shop.id}`);
  const [rawFavs, setRawFavs] = useStored(`ac-favs-${shop.id}`);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<string>("default");
  const [showFavs, setShowFavs] = useState(false);
  const now = serverNow ?? null;

  const favs: Set<string> = useMemo(() => {
    if (!rawFavs) return new Set();
    try {
      return new Set(JSON.parse(rawFavs) as string[]);
    } catch {
      return new Set();
    }
  }, [rawFavs]);

  const toggleFav = useCallback(
    (id: string) => {
      const next = new Set(favs);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setRawFavs(next.size ? JSON.stringify([...next]) : null);
    },
    [favs, setRawFavs],
  );

  const isNew = (item: CatalogItem) => {
    const d = new Date(item.createdAt);
    return now !== null && now - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  };

  const shareItem = async (item: CatalogItem) => {
    const url = pageOf(item);
    const text = `${item.name} at ${shop.name}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: item.name, text, url });
        return;
      } catch {}
    }
    window.open(waShareLink(`${text}:\n${url}`), "_blank", "noopener");
  };
  const [cartOpen, setCartOpen] = useState(false);
  const [viewing, setViewing] = useState<{
    item: CatalogItem;
    start: number;
  } | null>(null);
  // The item whose details are open (tapping a card).
  const [detail, setDetail] = useState<CatalogItem | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  // Drop cart entries for items (or options) that were removed or went out of stock.
  const cart = useMemo(() => {
    const parsed = parseCart(rawCart);
    const valid: Cart = {};
    for (const [key, qty] of Object.entries(parsed)) {
      const { itemId, optionId } = parseCartKey(key);
      const item = itemById.get(itemId);
      if (!item?.inStock) continue;
      const ok = optionId
        ? item.options.some((o) => o.id === optionId)
        : item.options.length === 0;
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

  /** The price a customer actually pays for one unit. */
  const effectivePrice = (item: CatalogItem) => item.salePrice ?? item.price;

  const cartLines = Object.entries(cart).map(([key, qty]) => {
    const { itemId, optionId } = parseCartKey(key);
    const item = itemById.get(itemId)!;
    const option = optionId
      ? (item.options.find((o) => o.id === optionId) ?? null)
      : null;
    const unitPrice = option ? option.price : effectivePrice(item);
    const unitMax = Math.max(
      unitPrice,
      (option ? option.maxPrice : item.maxPrice) ?? 0,
    );
    return { key, item, option, qty, unitPrice, unitMax };
  });
  const cartCount = cartLines.reduce((n, l) => n + l.qty, 0);
  const cartTotal = cartLines.reduce((n, l) => n + l.qty * l.unitPrice, 0);
  const cartMax = cartLines.reduce((n, l) => n + l.qty * l.unitMax, 0);
  /** How many of an item are in the cart, across its options. */
  const qtyOfItem = (item: CatalogItem) =>
    cartLines
      .filter((l) => l.item.id === item.id)
      .reduce((n, l) => n + l.qty, 0);

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
      : categories.filter(
          (c) => c.parentId === activeCat && usedSubs.has(c.id),
        );

  const q = query.trim().toLowerCase();
  const visible = items.filter((item) => {
    if (showFavs && !favs.has(item.id)) return false;
    if (
      q &&
      !`${item.name} ${item.description ?? ""}`.toLowerCase().includes(q)
    )
      return false;
    if (activeCat !== "all" && topOf(item) !== activeCat) return false;
    if (activeSub && item.categoryId !== activeSub) return false;
    return true;
  });

  const onSale = (item: CatalogItem) =>
    item.salePrice != null &&
    item.salePrice > 0 &&
    item.salePrice < item.price &&
    item.options.length === 0;

  const sorted = (() => {
    if (sort === "default") return visible;
    const copy = [...visible];
    switch (sort) {
      case "price-asc":
        return copy.sort((a, b) => effectivePrice(a) - effectivePrice(b));
      case "price-desc":
        return copy.sort((a, b) => effectivePrice(b) - effectivePrice(a));
      case "name":
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return copy;
    }
  })();

  const saleItems = sorted.filter((i) => onSale(i));

  const sections: {
    title: string | null;
    sale?: boolean;
    items: CatalogItem[];
  }[] =
    sort === "default" && activeCat === "all" && !q && topCats.length > 0
      ? [
          ...(saleItems.length > 0
            ? [{ title: "Discounted", sale: true, items: saleItems }]
            : []),
          ...topCats.map((c) => ({
            title: c.name,
            items: sorted.filter((i) => topOf(i) === c.id),
          })),
          {
            title: "More items",
            items: sorted.filter((i) => topOf(i) === null),
          },
        ].filter((s) => s.items.length > 0)
      : sort === "default" && activeCat === "all" && !q && saleItems.length > 0
        ? [
            { title: "Discounted", sale: true, items: saleItems },
            { title: null, items: sorted },
          ]
        : [{ title: null, items: sorted }];

  const sendOrder = () => {
    setError(null);
    startSending(async () => {
      try {
        const result = await createOrder({
          shopId: shop.id,
          lines: cartLines.map((l) => ({
            itemId: l.item.id,
            optionId: l.option?.id,
            qty: l.qty,
          })),
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
        setError(
          "Could not send the order. Check your internet and try again.",
        );
      }
    });
  };

  const stepper = (item: CatalogItem, compact = false) => {
    if (enquiry) {
      if (!item.inStock) {
        return (
          <span className="text-sm font-semibold text-(--t-muted)">
            {unavailableLabel(item.listing)}
          </span>
        );
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
      return (
        <span className="text-xs font-medium text-(--t-muted)">
          Out of stock
        </span>
      );
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
            inCart > 0
              ? "border-(--p) bg-(--p) text-(--pt)"
              : "border-(--pa) text-(--pa) hover:bg-(--ps)",
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
        <span
          className="min-w-6 text-center text-sm font-semibold"
          aria-live="polite"
        >
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
          : onSale(item)
            ? formatPrice(item.salePrice!)
            : (() => {
                const { min, max } = itemPriceSpan(item);
                return formatPriceRange(min, max);
              })()}
      </span>
      {onSale(item) && (
        <span className="ml-1.5 text-xs text-(--t-muted) line-through">
          {formatPrice(item.price)}
        </span>
      )}
      {item.mrp &&
        item.mrp > item.price &&
        item.options.length === 0 &&
        !item.maxPrice && (
          <span className="ml-1.5 text-xs text-(--t-muted) line-through">
            {formatPrice(item.mrp)}
          </span>
        )}
    </span>
  );

  /** An item's main photo. Tapping it opens all of the item's photos. */
  /** Photos of an item. Big cards slide through all of them; small ones show the first. */
  const photo = (item: CatalogItem, className: string, slide = false) =>
    slide && item.imageUrls.length > 1 ? (
      <ItemCarousel
        urls={item.imageUrls}
        name={item.name}
        onOpen={() => setDetail(item)}
        className={className}
      />
    ) : (
      <button
        type="button"
        onClick={() => setDetail(item)}
        className={cx("relative block cursor-pointer", className)}
        aria-label={`Open ${item.name}`}
      >
        <Image
          src={item.imageUrl ?? ""}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover"
        />
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
        <button
          type="button"
          onClick={() => setDetail(item)}
          className="text-left hover:underline"
        >
          {item.name}
        </button>
      </h3>
      {enquiry && summary(item) && (
        <p className="truncate text-xs text-(--t-muted)">{summary(item)}</p>
      )}
    </>
  );

  const noPhoto = (size: string) => (
    <div className="flex h-full items-center justify-center bg-(--ps) text-(--pa) opacity-70">
      <Icon name="bag" className={size} />
    </div>
  );

  const discount = (item: CatalogItem) => {
    if (item.options.length > 0 || item.maxPrice) return null;
    const displayPrice = effectivePrice(item);
    // Sale discount: compare salePrice to the regular selling price.
    if (onSale(item))
      return Math.round(((item.price - item.salePrice!) / item.price) * 100);
    // MRP discount: compare selling price to MRP.
    if (item.mrp && item.mrp > item.price)
      return Math.round(((item.mrp - item.price) / item.mrp) * 100);
    return null;
  };

  const renderItems = (list: CatalogItem[]) => {
    if (layout === "grid" || layout === "portrait") {
      const tall = layout === "portrait";
      return (
        <div
          className={cx(
            "grid",
            tall
              ? "grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4"
              : "grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5",
          )}
        >
          {list.map((item) => {
            const pct = discount(item);
            return (
              <article
                key={item.id}
                className={cx(
                  "group flex flex-col transition-transform duration-200 hover:-translate-y-0.5",
                  !tall && "t-card overflow-hidden",
                  look.center && "text-center",
                  !item.inStock && "opacity-60",
                )}
              >
                {/* Photo */}
                <div
                  className={cx(
                    tall ? "aspect-3/4" : "aspect-4/3",
                    "relative overflow-hidden bg-(--ps)",
                    tall && "t-photo",
                  )}
                >
                  {item.imageUrl
                    ? photo(item, "h-full w-full", true)
                    : noPhoto("h-8 w-8")}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {pct && pct >= 5 && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        {pct}% off
                      </span>
                    )}
                    {isNew(item) && (
                      <span className="rounded-full bg-(--p) px-2 py-0.5 text-[10px] font-semibold text-(--pt) shadow-sm">
                        New
                      </span>
                    )}
                  </div>

                  {/* Actions — hover on desktop, always on mobile */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleFav(item.id)}
                      aria-label={
                        favs.has(item.id)
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      className={cx(
                        "flex size-7 items-center justify-center rounded-full shadow-md transition-all",
                        favs.has(item.id)
                          ? "bg-white text-red-500"
                          : "bg-white/80 text-slate-500 opacity-0 group-hover:opacity-100 sm:flex",
                      )}
                    >
                      <Heart
                        className={cx(
                          "size-3.5",
                          favs.has(item.id) && "fill-red-500",
                        )}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => shareItem(item)}
                      aria-label={`Share ${item.name}`}
                      className="hidden size-7 items-center justify-center rounded-full bg-white/80 text-slate-500 shadow-md opacity-0 transition-all group-hover:opacity-100 sm:flex"
                    >
                      <Share2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div
                  className={cx("flex flex-1 flex-col", tall ? "pt-3" : "p-3")}
                >
                  {title(
                    item,
                    cx(
                      "line-clamp-2 text-sm font-medium leading-snug text-(--t-text)",
                      tall && "t-head text-base",
                    ),
                  )}
                  {item.unit && (
                    <p className="mt-0.5 text-xs text-(--t-muted)">
                      {item.unit}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                    {price(item)}
                  </div>
                  <div className="mt-auto pt-3">{stepper(item)}</div>
                </div>
              </article>
            );
          })}
        </div>
      );
    }

    if (layout === "list") {
      return (
        <div className="t-card divide-y divide-(--t-border) overflow-hidden">
          {list.map((item) => {
            const pct = discount(item);
            return (
              <article
                key={item.id}
                className={cx(
                  "group flex items-center gap-3.5 p-3.5 transition-colors hover:bg-(--ps)/40",
                  !item.inStock && "opacity-60",
                )}
              >
                <div className="t-photo relative h-18 w-18 shrink-0 overflow-hidden bg-(--ps)">
                  {item.imageUrl
                    ? photo(item, "h-full w-full")
                    : noPhoto("h-6 w-6")}
                  {pct && pct >= 5 && (
                    <span className="absolute bottom-0 left-0 right-0 bg-red-500 py-0.5 text-center text-[9px] font-bold text-white">
                      {pct}% off
                    </span>
                  )}
                  {isNew(item) && !pct && (
                    <span className="absolute -top-1 -left-1 rounded-full bg-(--p) px-1 py-px text-[9px] font-semibold text-(--pt)">
                      New
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {title(
                    item,
                    "line-clamp-2 text-sm font-medium leading-snug text-(--t-text)",
                  )}
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                    {price(item)}
                  </div>
                  {item.unit && (
                    <p className="text-xs text-(--t-muted)">{item.unit}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFav(item.id)}
                    aria-label={
                      favs.has(item.id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                    className="text-(--t-muted) transition-colors hover:text-(--t-text)"
                  >
                    <Heart
                      className={cx(
                        "size-4",
                        favs.has(item.id) && "fill-red-500 text-red-500",
                      )}
                    />
                  </button>
                  {stepper(item, true)}
                </div>
              </article>
            );
          })}
        </div>
      );
    }

    // menu layout
    return (
      <div className="t-card overflow-hidden">
        {list.map((item, i) => (
          <article
            key={item.id}
            className={cx(
              "group flex gap-4 px-5 py-4 transition-colors hover:bg-(--ps)/30",
              i > 0 && "border-t border-dashed border-(--t-border)",
              !item.inStock && "opacity-60",
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {isNew(item) && (
                    <span className="mb-1 inline-block rounded-full bg-(--ps) px-2 py-0.5 text-[10px] font-semibold text-(--pa)">
                      New
                    </span>
                  )}
                  {title(
                    item,
                    "t-head text-[1.05rem] leading-snug text-(--t-text)",
                  )}
                  {(item.description || item.unit) && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-(--t-muted)">
                      {[item.unit, item.description]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className="text-base font-bold"
                    style={{ color: "var(--p)" }}
                  >
                    {price(item)}
                  </p>
                  {item.mrp &&
                    item.mrp > item.price &&
                    item.options.length === 0 &&
                    !item.maxPrice && (
                      <p className="text-xs text-(--t-muted) line-through">
                        {formatPrice(item.mrp)}
                      </p>
                    )}
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                {stepper(item, true)}
                <button
                  type="button"
                  onClick={() => toggleFav(item.id)}
                  aria-label={
                    favs.has(item.id)
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                  className="text-(--t-muted) transition-colors hover:text-(--t-text)"
                >
                  <Heart
                    className={cx(
                      "size-4",
                      favs.has(item.id) && "fill-red-500 text-red-500",
                    )}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => shareItem(item)}
                  aria-label={`Share ${item.name}`}
                  className="text-(--t-muted) transition-colors hover:text-(--t-text)"
                >
                  <Share2 className="size-4" />
                </button>
              </div>
            </div>
            {item.imageUrl && (
              <div className="t-photo relative h-20 w-20 shrink-0 overflow-hidden bg-(--ps)">
                {photo(item, "h-full w-full")}
              </div>
            )}
          </article>
        ))}
      </div>
    );
  };

  const chip = (active: boolean) =>
    look.chips === "underline"
      ? cx(
          "border-b-2 px-1 py-1.5 text-sm font-medium whitespace-nowrap",
          active
            ? "border-(--pa) text-(--t-text)"
            : "border-transparent text-(--t-muted) hover:text-(--t-text)",
        )
      : cx(
          "border px-3 py-1.5 text-sm font-medium whitespace-nowrap",
          look.chips === "square" ? "rounded-sm" : "rounded-full",
          active
            ? "border-(--p) bg-(--p) text-(--pt)"
            : "border-(--t-border) bg-(--t-surface) text-(--t-text) hover:border-(--p)",
        );

  return (
    <div className="pb-24">
      {rawLast && cartCount === 0 && (
        <Alert
          variant="success"
          className="mb-4 flex flex-wrap items-center justify-between gap-2"
        >
          <span>Your order was sent to the shop on WhatsApp.</span>
          <span className="flex gap-3">
            <a href={`/o/${rawLast}`} className="font-semibold underline">
              View / save as PDF
            </a>
            <button
              type="button"
              onClick={() => setRawLast(null)}
              className="text-emerald-700"
            >
              Dismiss
            </button>
          </span>
        </Alert>
      )}

      {items.length > 1 && (
        <div className="mb-3 flex gap-2">
          {items.length > 6 && (
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search"
              className="flex-1"
            />
          )}
          <button
            type="button"
            onClick={() => setShowFavs(!showFavs)}
            aria-label={showFavs ? "Show all items" : "Show favorites"}
            className={cx(
              "flex h-9 items-center gap-1.5 rounded-(--t-radius) border px-2.5 text-sm",
              showFavs
                ? "border-(--pa) bg-(--ps) text-(--pa)"
                : "border-(--t-border) bg-(--t-surface) text-(--t-muted) hover:text-(--t-text)",
            )}
          >
            <Heart className={cx("size-3.5", showFavs && "fill-current")} />
            <span className="hidden sm:inline">
              {showFavs ? "All" : "Favorites"}
            </span>
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort by"
            className="h-9 rounded-(--t-radius) border border-(--t-border) bg-(--t-surface) px-2 text-sm text-(--t-text)"
          >
            <option value="default">Sort</option>
            <option value="price-asc">Price: Low to high</option>
            <option value="price-desc">Price: High to low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      )}

      {topCats.length > 1 && (
        <nav
          aria-label="Categories"
          className={cx(
            "no-scrollbar sticky top-0 z-10 -mx-4 flex items-center overflow-x-auto bg-(--t-bg)/95 px-4 py-2 backdrop-blur",
            look.chips === "underline" ? "gap-4" : "gap-2",
          )}
        >
          <select
            value={activeCat}
            onChange={(e) => {
              setActiveCat(e.target.value);
              setActiveSub(null);
            }}
            aria-label="Select category"
            className="mr-1 h-8 shrink-0 rounded-(--t-radius) border border-(--t-border) bg-(--t-surface) px-2 text-sm text-(--t-text)"
          >
            <option value="all">All categories</option>
            {topCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="hidden h-5 w-px bg-(--t-border) sm:block" />
          <button
            type="button"
            className={cx(chip(activeCat === "all"), "hidden sm:inline-flex")}
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
              className={cx(chip(activeCat === c.id), "hidden sm:inline-flex")}
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
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
          <select
            value={activeSub ?? ""}
            onChange={(e) => setActiveSub(e.target.value || null)}
            aria-label="Sub-category"
            className="h-7 shrink-0 rounded border border-(--t-border) bg-(--t-surface) px-1.5 text-xs text-(--t-text) sm:hidden"
          >
            <option value="">All sub-categories</option>
            {subCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {[{ id: null as string | null, name: "All" }, ...subCats].map((c) => (
            <button
              key={c.id ?? "all"}
              type="button"
              onClick={() => setActiveSub(c.id)}
              className={cx(
                "hidden rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap sm:inline-flex",
                activeSub === c.id
                  ? "bg-(--ps) text-(--pa)"
                  : "text-(--t-muted) hover:bg-(--ps)",
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
            <p className="t-head mt-4 text-lg text-(--t-text)">
              Catalog coming soon
            </p>
            <p className="mt-1 max-w-xs text-sm text-(--t-muted)">
              {shop.name} is adding items. Message them on WhatsApp to ask what
              is available today.
            </p>
          </div>
        ) : (
          <p className="t-card mt-3 px-4 py-10 text-center text-(--t-muted)">
            No items to show
          </p>
        )
      ) : (
        sections.map((section) => (
          <section key={section.title ?? "all"} className="mt-4">
            {section.title && (
              <h2
                className={cx(
                  "t-head mb-2.5 text-lg text-(--t-text)",
                  look.center && "text-center",
                )}
              >
                {section.title}
              </h2>
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
                {cartCount} items in cart
              </p>
              <p className="text-lg font-bold text-(--t-text)">
                {formatPriceRange(cartTotal, cartMax)}
              </p>
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
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="t-page mx-auto max-h-[90dvh] w-full max-w-lg gap-0 rounded-t-2xl bg-(--t-surface) p-0 text-base"
          >
            <div className="flex items-center justify-between border-b border-(--t-border) px-5 py-3">
              <SheetTitle className="t-head text-lg text-(--t-text)">
                Your cart
              </SheetTitle>
              <SheetClose
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-(--t-muted)"
                    aria-label="Close cart"
                  />
                }
              >
                <Icon name="x" />
              </SheetClose>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {cartLines.length === 0 && (
                <p className="py-6 text-center text-(--t-muted)">
                  Your cart is empty
                </p>
              )}
              <ul className="divide-y divide-(--t-border)">
                {cartLines.map(
                  ({ key, item, option, qty, unitPrice, unitMax }) => (
                    <li key={key} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-(--t-text)">
                          {item.name}
                          {option && (
                            <span className="text-(--t-muted)">
                              {" "}
                              ({option.name})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-(--t-muted)">
                          {formatPriceRange(unitPrice, unitMax)} × {qty} ={" "}
                          <span className="font-semibold text-(--t-text)">
                            {formatPriceRange(unitPrice * qty, unitMax * qty)}
                          </span>
                        </p>
                      </div>
                      {qtyControl(
                        key,
                        option ? `${item.name} (${option.name})` : item.name,
                        true,
                      )}
                    </li>
                  ),
                )}
              </ul>

              {cartLines.length > 0 && (
                <div className="mt-3 space-y-3">
                  <div>
                    <Label htmlFor="cart-name">Your name</Label>
                    <Input
                      id="cart-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={60}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cart-note">Note (optional)</Label>
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
                {error && (
                  <Alert variant="destructive" className="mb-3">
                    {error}
                  </Alert>
                )}
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-(--t-muted)">Total</span>
                  <span className="text-xl font-bold">
                    {formatPriceRange(cartTotal, cartMax)}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={sendOrder}
                  disabled={sending}
                  variant="whatsapp"
                  className="w-full text-base"
                >
                  {sending ? "Opening WhatsApp..." : "Send order on WhatsApp"}
                </Button>
                <p className="mt-2 text-center text-xs text-(--t-muted)">
                  No payment now. {shop.name} will confirm the final price and
                  availability on WhatsApp.
                </p>
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}

      {choosing && (
        <Sheet open onOpenChange={(open) => !open && setChoosing(null)}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className="t-page mx-auto max-h-[80dvh] w-full max-w-lg gap-0 rounded-t-2xl bg-(--t-surface) p-0 text-base"
          >
            <div className="flex items-center justify-between border-b border-(--t-border) px-5 py-3">
              <SheetTitle className="t-head truncate text-lg text-(--t-text)">
                {choosing.name}
              </SheetTitle>
              <SheetClose
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-(--t-muted)"
                    aria-label="Close"
                  />
                }
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
                  {qtyControl(
                    cartKey(choosing.id, o.id),
                    `${choosing.name} (${o.name})`,
                    true,
                  )}
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
              <div
                className="relative w-full bg-(--ps)"
                style={{ aspectRatio: "4/3" }}
              >
                <ItemCarousel
                  urls={detail.imageUrls}
                  name={detail.name}
                  onOpen={(i) => setViewing({ item: detail, start: i })}
                />
              </div>
            )}
            <div className="space-y-3 p-5">
              <div>
                <DialogTitle className="t-head text-xl text-(--t-text)">
                  {detail.name}
                </DialogTitle>
                <p className="mt-1 text-lg">
                  {price(detail)}
                  {detail.unit && (
                    <span className="ml-1.5 text-sm text-(--t-muted)">
                      / {detail.unit}
                    </span>
                  )}
                </p>
              </div>
              {detail.description ? (
                <DialogDescription className="text-sm whitespace-pre-line text-(--t-text) opacity-90">
                  {detail.description}
                </DialogDescription>
              ) : (
                <DialogDescription className="sr-only">
                  Price and options of {detail.name}
                </DialogDescription>
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
                      className={buttonVariants({
                        variant: "whatsapp",
                        className: "w-full text-base",
                      })}
                    >
                      Enquire on WhatsApp
                    </a>
                  ) : (
                    <p className="font-semibold text-(--t-muted)">
                      {unavailableLabel(detail.listing)}
                    </p>
                  )}
                  <a
                    href={pageOf(detail)}
                    className="block text-center text-sm text-(--t-muted) underline"
                  >
                    Open this listing&apos;s page to share it
                  </a>
                </div>
              ) : !detail.inStock ? (
                <p className="font-medium text-(--t-muted)">Out of stock</p>
              ) : detail.options.length > 0 ? (
                <ul className="divide-y divide-(--t-border) rounded-(--t-radius) border border-(--t-border)">
                  {detail.options.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-(--t-text)">{o.name}</p>
                        <p className="text-sm text-(--t-muted)">
                          {formatPriceRange(o.price, o.maxPrice)}
                        </p>
                      </div>
                      {qtyControl(
                        cartKey(detail.id, o.id),
                        `${detail.name} (${o.name})`,
                        true,
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="max-w-40">
                  {qtyControl(detail.id, detail.name)}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDetail(null)}
                  className="t-btn flex-1 border-(--t-border)"
                >
                  {cartCount > 0 ? "Continue shopping" : "Close"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toggleFav(detail.id)}
                  className="t-btn border-(--t-border)"
                  aria-label={
                    favs.has(detail.id)
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  <Heart
                    className={cx(
                      "size-4",
                      favs.has(detail.id) && "fill-red-500 text-red-500",
                    )}
                  />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => shareItem(detail)}
                  className="t-btn border-(--t-border)"
                  aria-label={`Share ${detail.name}`}
                >
                  <Share2 className="size-4" />
                </Button>
              </div>
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
          urls={
            viewing.item.imageUrls.length > 0
              ? viewing.item.imageUrls
              : [viewing.item.imageUrl ?? ""]
          }
          start={viewing.start}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
