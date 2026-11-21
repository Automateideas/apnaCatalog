"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteCategory,
  deleteItem,
  saveCategory,
  saveItem,
  setItemStock,
} from "@/app/actions/items";
import { confirmDialog, promptDialog } from "@/components/dialogs";
import { ItemPhotos } from "@/components/ItemPhotos";
import { discardUploads } from "@/lib/upload";
import { formatPriceRange, type ItemDetail, type ItemOption, itemPriceSpan, MAX_ITEM_OPTIONS } from "@/lib/item-options";
import { FURNISHING, isPropertyShop, type Listing, LISTINGS, listingPrice, PROPERTY_FIELDS, unavailableLabel } from "@/lib/property";

const PLACEHOLDER: Record<string, string> = {
  BHK: "2 BHK",
  Area: "1,150 sq ft",
  Floor: "3rd of 7",
  Locality: "Raj Nagar Extension",
  Deposit: "₹36,000",
  "Available from": "Immediately",
};
import { cx, type ActionResult } from "@/lib/utils";
import { Icon, IconBadge } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type Category = { id: string; name: string; parentId: string | null };
type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  mrp: number | null;
  maxPrice: number | null;
  options: ItemOption[];
  listing: string | null;
  details: ItemDetail[];
  unit: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  inStock: boolean;
  categoryId: string | null;
};

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  mrp: string;
  /** Top of a price range, for work whose final price the shop sets later. */
  maxPrice: string;
  options: DraftOption[];
  /** Property listings: sale or rent, and facts by label (BHK, Area...). */
  listing: Listing;
  details: Record<string, string>;
  unit: string;
  imageUrls: string[];
  /** Photos the saved item has. Any other photo in imageUrls was uploaded in this form. */
  savedImageUrls: string[];
  inStock: boolean;
  categoryId: string;
};

type DraftOption = { id?: string; name: string; price: string; maxPrice: string };

/** "" for empty, NaN for not a number, else the number. */
const num = (value: string) => (value.trim() === "" ? null : Number(value));

const emptyDraft: Draft = {
  name: "",
  description: "",
  price: "",
  mrp: "",
  maxPrice: "",
  options: [],
  listing: "sale",
  details: {},
  unit: "",
  imageUrls: [],
  savedImageUrls: [],
  inStock: true,
  categoryId: "",
};

export function ItemsManager({
  items,
  categories,
  itemLimit,
  photoLimit,
  planName,
  businessType,
}: {
  items: Item[];
  categories: Category[];
  /** Null when the plan has no limit. */
  itemLimit: number | null;
  /** Photos allowed per item on this plan. */
  photoLimit: number;
  planName: string;
  businessType: string;
}) {
  const property = isPropertyShop(businessType);
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [filter, setFilter] = useState("");
  const [pending, startTransition] = useTransition();
  // Saving waits for photo uploads, so no photo is left out of the save.
  const [uploading, setUploading] = useState(false);

  const topCats = categories.filter((c) => !c.parentId);
  const subsOf = (id: string) => categories.filter((c) => c.parentId === id);
  const catName = (id: string | null) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return null;
    const parent = cat.parentId ? categories.find((c) => c.id === cat.parentId) : null;
    return parent ? `${parent.name} / ${cat.name}` : cat.name;
  };

  const atLimit = itemLimit !== null && items.length >= itemLimit;

  /** Runs a server action, shows its error, and reloads the data. */
  const run = (action: () => Promise<ActionResult>, onDone?: () => void) => {
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        onDone?.();
        router.refresh();
      } catch {
        toast.error("Something went wrong. Check your internet and try again.");
      }
    });
  };

  /** Closes the item form without saving, and deletes the photos uploaded in it. */
  const closeForm = () => {
    if (draft) {
      void discardUploads(draft.imageUrls.filter((url) => !draft.savedImageUrls.includes(url)));
    }
    setDraft(null);
  };

  const submitItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setFormError(null);
    const hasOptions = draft.options.length > 0;
    const options = draft.options.map((o) => ({ id: o.id, name: o.name, price: num(o.price), maxPrice: num(o.maxPrice) }));
    if (options.some((o) => o.price === null || !Number.isFinite(o.price) || o.price < 0)) {
      setFormError("Enter a price for every option.");
      return;
    }
    if (options.some((o) => o.maxPrice !== null && !Number.isFinite(o.maxPrice))) {
      setFormError("\"Up to\" prices must be numbers.");
      return;
    }
    // With options, the item's own price is worked out from them on the server.
    const price = hasOptions ? 0 : Number(draft.price);
    if (!hasOptions && (draft.price.trim() === "" || !Number.isFinite(price) || price < 0)) {
      setFormError("Enter the price.");
      return;
    }
    const mrp = hasOptions ? null : num(draft.mrp);
    const maxPrice = hasOptions ? null : num(draft.maxPrice);
    if ((mrp !== null && !Number.isFinite(mrp)) || (maxPrice !== null && !Number.isFinite(maxPrice))) {
      setFormError("Prices must be numbers.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await saveItem({
          id: draft.id,
          name: draft.name,
          description: draft.description,
          price,
          mrp,
          maxPrice,
          options: options.map((o) => ({ ...o, price: o.price ?? 0 })),
          listing: property ? draft.listing : null,
          details: property
            ? PROPERTY_FIELDS.filter((f) => f !== "Deposit" || draft.listing === "rent").map((label) => ({
                label,
                value: draft.details[label] ?? "",
              }))
            : [],
          unit: draft.unit,
          categoryId: draft.categoryId || null,
          imageUrls: draft.imageUrls,
          inStock: draft.inStock,
        });
        if (!result.ok) {
          setFormError(result.error);
          return;
        }
        setDraft(null);
        router.refresh();
      } catch {
        setFormError("Could not save. Check your internet and try again.");
      }
    });
  };

  const editItem = (item: Item) => {
    setFormError(null);
    setDraft({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      price: String(item.price / 100),
      mrp: item.mrp ? String(item.mrp / 100) : "",
      maxPrice: item.maxPrice ? String(item.maxPrice / 100) : "",
      options: item.options.map((o) => ({
        id: o.id,
        name: o.name,
        price: String(o.price / 100),
        maxPrice: o.maxPrice ? String(o.maxPrice / 100) : "",
      })),
      listing: item.listing === "rent" ? "rent" : "sale",
      details: Object.fromEntries(item.details.map((d) => [d.label, d.value])),
      unit: item.unit ?? "",
      imageUrls: item.imageUrls,
      savedImageUrls: item.imageUrls,
      inStock: item.inStock,
      categoryId: item.categoryId ?? "",
    });
  };

  const q = filter.trim().toLowerCase();
  const shown = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Items</h1>
          <p className="text-sm text-slate-500">
            {itemLimit === null
              ? `${items.length} items`
              : `${items.length} of ${itemLimit} items used on the ${planName} plan`}
          </p>
        </div>
        <Button
          type="button"
          disabled={atLimit}
          onClick={() => {
            setFormError(null);
            setDraft({ ...emptyDraft });
          }}
        >
          + Add item
        </Button>
      </div>

      {atLimit && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have used all {itemLimit} items of the {planName} plan.{" "}
          <Link href="/dashboard/plan" className="font-semibold underline">
            Upgrade for unlimited items
          </Link>
        </p>
      )}

      <details className="rounded-xl border bg-card p-4">
        <summary className="cursor-pointer font-semibold text-slate-900">
          Categories ({topCats.length})
        </summary>
        <ul className="mt-3 space-y-3">
          {topCats.map((cat) => (
            <li key={cat.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-900">{cat.name}</span>
                <span className="flex gap-1 text-sm">
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
                    disabled={pending}
                    onClick={async () => {
                      const name = await promptDialog({
                        title: `New subcategory in ${cat.name}`,
                        label: "Subcategory name",
                        maxLength: 40,
                        confirmLabel: "Add",
                      });
                      if (name) run(() => saveCategory({ name, parentId: cat.id }));
                    }}
                  >
                    + Sub
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
                    disabled={pending}
                    onClick={async () => {
                      const name = await promptDialog({
                        title: "Rename category",
                        label: "Category name",
                        defaultValue: cat.name,
                        maxLength: 40,
                      });
                      if (name) run(() => saveCategory({ id: cat.id, name }));
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
                    disabled={pending}
                    onClick={async () => {
                      const ok = await confirmDialog({
                        title: `Delete "${cat.name}"?`,
                        description:
                          "Its subcategories are deleted too. Items in it are kept, without a category.",
                        confirmLabel: "Delete",
                        destructive: true,
                      });
                      if (ok) run(() => deleteCategory(cat.id));
                    }}
                  >
                    Delete
                  </button>
                </span>
              </div>
              {subsOf(cat.id).length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {subsOf(cat.id).map((sub) => (
                    <li
                      key={sub.id}
                      className="flex items-center gap-1 rounded-full bg-slate-100 py-1 pr-1 pl-3 text-sm"
                    >
                      <button
                        type="button"
                        disabled={pending}
                        title="Rename"
                        onClick={async () => {
                          const name = await promptDialog({
                            title: "Rename subcategory",
                            label: "Subcategory name",
                            defaultValue: sub.name,
                            maxLength: 40,
                          });
                          if (name) run(() => saveCategory({ id: sub.id, name }));
                        }}
                      >
                        {sub.name}
                      </button>
                      <button
                        type="button"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200"
                        aria-label={`Delete ${sub.name}`}
                        disabled={pending}
                        onClick={async () => {
                          const ok = await confirmDialog({
                            title: `Delete subcategory "${sub.name}"?`,
                            description: "Items in it are kept, without a category.",
                            confirmLabel: "Delete",
                            destructive: true,
                          });
                          if (ok) run(() => deleteCategory(sub.id));
                        }}
                      >
                        <Icon name="x" className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newCategory.trim()) {
              run(() => saveCategory({ name: newCategory }), () => setNewCategory(""));
            }
          }}
        >
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            aria-label="New category name"
            maxLength={40}
          />
          <Button type="submit" variant="outline" disabled={pending || !newCategory.trim()}>
            Add
          </Button>
        </form>
      </details>

      {items.length > 8 && (
        <Input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search your items"
          aria-label="Search your items"
        />
      )}

      {items.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <IconBadge name="box" />
          <p className="mt-3 font-semibold text-slate-900">No items yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Add your first item: a name, a price and a photo is enough.
          </p>
        </Card>
      ) : (
        <ul className="rounded-xl border bg-card divide-y divide-slate-100">
          {shown.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {item.imageUrls.length > 1 && (
                  <span className="absolute right-0.5 bottom-0.5 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
                    {item.imageUrls.length}
                  </span>
                )}
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300">
                    <Icon name="camera" className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{item.name}</p>
                <p className="truncate text-sm text-slate-500">
                  <span className="font-semibold text-slate-800">
                    {property ? listingPrice(item) : (() => {
                      const { min, max } = itemPriceSpan(item);
                      return formatPriceRange(min, max);
                    })()}
                  </span>
                  {item.options.length > 0 && ` · ${item.options.length} options`}
                  {item.unit && ` / ${item.unit}`}
                  {catName(item.categoryId) && `, ${catName(item.categoryId)}`}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={item.inStock}
                  aria-label={`${item.name} in stock`}
                  disabled={pending}
                  onClick={() => run(() => setItemStock(item.id, !item.inStock))}
                  className={cx(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    item.inStock ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600",
                  )}
                >
                  {item.inStock ? (property ? "Available" : "In stock") : property ? unavailableLabel(item.listing) : "Out of stock"}
                </button>
                <span className="flex gap-1 text-sm">
                  <button
                    type="button"
                    className="rounded px-2 py-1 font-medium text-brand hover:bg-brand-soft"
                    onClick={() => editItem(item)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
                    disabled={pending}
                    onClick={async () => {
                      const ok = await confirmDialog({
                        title: `Delete "${item.name}"?`,
                        confirmLabel: "Delete",
                        destructive: true,
                      });
                      if (ok) run(() => deleteItem(item.id));
                    }}
                  >
                    Delete
                  </button>
                </span>
              </div>
            </li>
          ))}
          {shown.length === 0 && <li className="p-6 text-center text-slate-500">No items found.</li>}
        </ul>
      )}

      {draft && (
        <Sheet open onOpenChange={(open) => !open && closeForm()}>
          <SheetContent side="bottom" showCloseButton={false} className="mx-auto w-full max-w-lg gap-0 rounded-t-2xl p-0 text-base max-h-[92dvh]">
          <form onSubmit={submitItem} className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <SheetTitle className="text-lg font-bold">{draft.id ? "Edit item" : "Add item"}</SheetTitle>
              <SheetClose
                render={<Button variant="ghost" size="icon" className="text-slate-500" aria-label="Close" />}
              >
                <Icon name="x" />
              </SheetClose>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <ItemPhotos
                folder={`items/${draft.name}`}
                max={Math.max(photoLimit, draft.savedImageUrls.length)}
                value={draft.imageUrls}
                savedUrls={draft.savedImageUrls}
                onBusyChange={setUploading}
                onAdd={(url) =>
                  setDraft((d) => (d ? { ...d, imageUrls: [...d.imageUrls, url] } : d))
                }
                onChange={(imageUrls) => setDraft((d) => (d ? { ...d, imageUrls } : d))}
              />
              <div>
                <Label htmlFor="item-name">
                  Item name
                </Label>
                <Input
                  id="item-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  required
                  maxLength={80}
                />
              </div>
              {property && (
                <div>
                  <Label>Listing</Label>
                  <div className="mt-1 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Listing">
                    {LISTINGS.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        role="radio"
                        aria-checked={draft.listing === l.id}
                        onClick={() => setDraft({ ...draft, listing: l.id })}
                        className={cx(
                          "rounded-lg border-2 py-2 text-sm font-semibold",
                          draft.listing === l.id ? "border-brand bg-brand-soft text-brand" : "border-slate-200 text-slate-600",
                        )}
                      >
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {draft.options.length === 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="item-price">{property && draft.listing === "rent" ? "Rent ₹ / month" : "Price ₹"}</Label>
                    <Input
                      id="item-price"
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                      required
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-max">Up to ₹</Label>
                    <Input
                      id="item-max"
                      value={draft.maxPrice}
                      onChange={(e) => setDraft({ ...draft, maxPrice: e.target.value })}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      aria-describedby="item-max-hint"
                    />
                  </div>
                  <p id="item-max-hint" className="col-span-2 -mt-1 text-xs text-slate-500">
                    Fill &quot;Up to&quot; when the price depends on the work (₹200 – ₹500). Customers see the
                    range; you confirm the final price.
                  </p>
                  {!property && (<>
                  <div>
                    <Label htmlFor="item-mrp">MRP ₹</Label>
                    <Input
                      id="item-mrp"
                      value={draft.mrp}
                      onChange={(e) => setDraft({ ...draft, mrp: e.target.value })}
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-unit">Unit</Label>
                    <Input
                      id="item-unit"
                      value={draft.unit}
                      onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                      maxLength={20}
                      placeholder="1 kg, piece"
                    />
                  </div>
                  </>)}
                </div>
              )}

              {property && (
                <fieldset className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-3">
                  <legend className="px-1 text-sm font-semibold text-slate-800">Property details</legend>
                  {PROPERTY_FIELDS.filter((f) => f !== "Deposit" || draft.listing === "rent").map((field) => {
                    const id = `detail-${field.replace(/\s/g, "-").toLowerCase()}`;
                    const value = draft.details[field] ?? "";
                    const set = (v: string) => setDraft({ ...draft, details: { ...draft.details, [field]: v } });
                    return (
                      <div key={field} className={field === "Locality" ? "col-span-2" : undefined}>
                        <Label htmlFor={id}>{field}</Label>
                        {field === "Furnishing" ? (
                          <NativeSelect id={id} value={value} onChange={(e) => set(e.target.value)}>
                            <option value="">Choose</option>
                            {FURNISHING.map((f) => (
                              <option key={f}>{f}</option>
                            ))}
                          </NativeSelect>
                        ) : (
                          <Input id={id} value={value} onChange={(e) => set(e.target.value)} maxLength={60} placeholder={PLACEHOLDER[field]} />
                        )}
                      </div>
                    );
                  })}
                </fieldset>
              )}

              {/* Options: one item, one photo, several choices with their own price. */}
              {!property && <fieldset className="rounded-xl border border-slate-200 p-3">
                <legend className="px-1 text-sm font-semibold text-slate-800">Options</legend>
                <p className="text-xs text-slate-500">
                  For choices with their own price: Dry clean / Steam press, 500 g / 1 kg, S / M / L.
                </p>
                {draft.options.length > 0 && (
                  <ul className="mt-3 space-y-3">
                    {draft.options.map((o, i) => {
                      const setOpt = (patch: Partial<DraftOption>) =>
                        setDraft((d) =>
                          d ? { ...d, options: d.options.map((x, j) => (j === i ? { ...x, ...patch } : x)) } : d,
                        );
                      return (
                        <li key={o.id ?? `new-${i}`} className="grid grid-cols-[1fr_5.5rem_5.5rem_auto] items-end gap-2">
                          <div>
                            <Label htmlFor={`opt-name-${i}`} className="text-xs">Option</Label>
                            <Input
                              id={`opt-name-${i}`}
                              value={o.name}
                              onChange={(e) => setOpt({ name: e.target.value })}
                              required
                              maxLength={40}
                              placeholder="Dry clean"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`opt-price-${i}`} className="text-xs">Price ₹</Label>
                            <Input
                              id={`opt-price-${i}`}
                              value={o.price}
                              onChange={(e) => setOpt({ price: e.target.value })}
                              required
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`opt-max-${i}`} className="text-xs">Up to ₹</Label>
                            <Input
                              id={`opt-max-${i}`}
                              value={o.maxPrice}
                              onChange={(e) => setOpt({ maxPrice: e.target.value })}
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="0.01"
                              placeholder="—"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-slate-500"
                            aria-label={`Remove option ${o.name || i + 1}`}
                            onClick={() =>
                              setDraft((d) => (d ? { ...d, options: d.options.filter((_, j) => j !== i) } : d))
                            }
                          >
                            <Icon name="x" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {draft.options.length < MAX_ITEM_OPTIONS && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      setDraft((d) =>
                        d ? { ...d, options: [...d.options, { name: "", price: d.options.length === 0 ? d.price : "", maxPrice: "" }] } : d,
                      )
                    }
                  >
                    + Add option
                  </Button>
                )}
                {draft.options.length > 0 && (
                  <div className="mt-3">
                    <Label htmlFor="item-unit">Unit</Label>
                    <Input
                      id="item-unit"
                      value={draft.unit}
                      onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                      maxLength={20}
                      placeholder="piece"
                    />
                  </div>
                )}
              </fieldset>}
              <div>
                <Label htmlFor="item-category">
                  Category
                </Label>
                <NativeSelect
                  id="item-category"
                  value={draft.categoryId}
                  onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
                >
                  <option value="">No category</option>
                  {topCats.map((cat) => (
                    <optgroup key={cat.id} label={cat.name}>
                      <option value={cat.id}>{cat.name}</option>
                      {subsOf(cat.id).map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {cat.name} / {sub.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <Label htmlFor="item-description">
                  Description (optional)
                </Label>
                <Textarea
                  id="item-description"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  maxLength={500}
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#1b2340]"
                  checked={draft.inStock}
                  onChange={(e) => setDraft({ ...draft, inStock: e.target.checked })}
                />
                {property ? "Available (untick when sold or rented)" : "In stock"}
              </label>
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              {formError && <Alert variant="destructive" className="mb-3">{formError}</Alert>}
              <Button type="submit" className="w-full text-base" disabled={pending || uploading}>
                {pending ? "Saving..." : uploading ? "Uploading photos..." : "Save item"}
              </Button>
            </div>
          </form>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
