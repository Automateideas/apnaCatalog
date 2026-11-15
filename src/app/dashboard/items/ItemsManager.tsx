"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteCategory,
  deleteItem,
  saveCategory,
  saveItem,
  setItemStock,
} from "@/app/actions/items";
import { ImageUpload } from "@/components/ImageUpload";
import { cx, formatPrice, type ActionResult } from "@/lib/utils";
import { Icon, IconBadge } from "@/components/Icon";

type Category = { id: string; name: string; parentId: string | null };
type Item = {
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

type Draft = {
  id?: string;
  name: string;
  description: string;
  price: string;
  mrp: string;
  unit: string;
  imageUrl: string | null;
  inStock: boolean;
  categoryId: string;
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  price: "",
  mrp: "",
  unit: "",
  imageUrl: null,
  inStock: true,
  categoryId: "",
};

export function ItemsManager({
  userId,
  items,
  categories,
  itemLimit,
}: {
  userId: string;
  items: Item[];
  categories: Category[];
  /** Null when the plan has no limit. */
  itemLimit: number | null;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [filter, setFilter] = useState("");
  const [pending, startTransition] = useTransition();

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
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onDone?.();
        router.refresh();
      } catch {
        setError("Something went wrong. Check your internet and try again.");
      }
    });
  };

  const submitItem = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setFormError(null);
    const price = Number(draft.price);
    if (draft.price.trim() === "" || !Number.isFinite(price) || price < 0) {
      setFormError("Enter the price.");
      return;
    }
    const mrp = draft.mrp.trim() === "" ? null : Number(draft.mrp);
    if (mrp !== null && !Number.isFinite(mrp)) {
      setFormError("MRP must be a number.");
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
          unit: draft.unit,
          categoryId: draft.categoryId || null,
          imageUrl: draft.imageUrl,
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
      unit: item.unit ?? "",
      imageUrl: item.imageUrl,
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
              : `${items.length} of ${itemLimit} items used on the free plan`}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          disabled={atLimit}
          onClick={() => {
            setFormError(null);
            setDraft({ ...emptyDraft });
          }}
        >
          + Add item
        </button>
      </div>

      {atLimit && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have used all {itemLimit} free items.{" "}
          <Link href="/dashboard/plan" className="font-semibold underline">
            Upgrade for unlimited items
          </Link>
        </p>
      )}

      {error && <p className="error-text">{error}</p>}

      <details className="card p-4">
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
                    onClick={() => {
                      const name = window.prompt("Subcategory name", "");
                      if (name?.trim()) run(() => saveCategory({ name, parentId: cat.id }));
                    }}
                  >
                    + Sub
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
                    disabled={pending}
                    onClick={() => {
                      const name = window.prompt("Category name", cat.name);
                      if (name?.trim()) run(() => saveCategory({ id: cat.id, name }));
                    }}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-red-600 hover:bg-red-50"
                    disabled={pending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete "${cat.name}" and its subcategories? Items in it are kept without a category.`,
                        )
                      ) {
                        run(() => deleteCategory(cat.id));
                      }
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
                        onClick={() => {
                          const name = window.prompt("Subcategory name", sub.name);
                          if (name?.trim()) run(() => saveCategory({ id: sub.id, name }));
                        }}
                      >
                        {sub.name}
                      </button>
                      <button
                        type="button"
                        className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200"
                        aria-label={`Delete ${sub.name}`}
                        disabled={pending}
                        onClick={() => {
                          if (window.confirm(`Delete subcategory "${sub.name}"?`)) {
                            run(() => deleteCategory(sub.id));
                          }
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
          <input
            className="input"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            aria-label="New category name"
            maxLength={40}
          />
          <button type="submit" className="btn-outline" disabled={pending || !newCategory.trim()}>
            Add
          </button>
        </form>
      </details>

      {items.length > 8 && (
        <input
          type="search"
          className="input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search your items"
          aria-label="Search your items"
        />
      )}

      {items.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <IconBadge name="box" />
          <p className="mt-3 font-semibold text-slate-900">No items yet</p>
          <p className="mt-1 text-sm text-slate-600">
            Add your first item: a name, a price and a photo is enough.
          </p>
        </div>
      ) : (
        <ul className="card divide-y divide-slate-100">
          {shown.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
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
                  <span className="font-semibold text-slate-800">{formatPrice(item.price)}</span>
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
                  {item.inStock ? "In stock" : "Out of stock"}
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
                    onClick={() => {
                      if (window.confirm(`Delete "${item.name}"?`)) run(() => deleteItem(item.id));
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
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={draft.id ? "Edit item" : "Add item"}
        >
          <form
            onSubmit={submitItem}
            className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold">{draft.id ? "Edit item" : "Add item"}</h2>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
                onClick={() => setDraft(null)}
              >
                <Icon name="x" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <ImageUpload
                label="Photo"
                kind="item"
                userId={userId}
                value={draft.imageUrl}
                onChange={(imageUrl) => setDraft({ ...draft, imageUrl })}
              />
              <div>
                <label className="label" htmlFor="item-name">
                  Item name
                </label>
                <input
                  id="item-name"
                  className="input"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  required
                  maxLength={80}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label" htmlFor="item-price">
                    Price ₹
                  </label>
                  <input
                    id="item-price"
                    className="input"
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
                  <label className="label" htmlFor="item-mrp">
                    MRP ₹
                  </label>
                  <input
                    id="item-mrp"
                    className="input"
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
                  <label className="label" htmlFor="item-unit">
                    Unit
                  </label>
                  <input
                    id="item-unit"
                    className="input"
                    value={draft.unit}
                    onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                    maxLength={20}
                    placeholder="1 kg, piece"
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="item-category">
                  Category
                </label>
                <select
                  id="item-category"
                  className="input"
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
                </select>
              </div>
              <div>
                <label className="label" htmlFor="item-description">
                  Description (optional)
                </label>
                <textarea
                  id="item-description"
                  className="input"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  maxLength={500}
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[#1e3fae]"
                  checked={draft.inStock}
                  onChange={(e) => setDraft({ ...draft, inStock: e.target.checked })}
                />
                In stock
              </label>
            </div>

            <div className="border-t border-slate-100 px-5 py-4">
              {formError && <p className="error-text mb-3">{formError}</p>}
              <button type="submit" className="btn-primary w-full text-base" disabled={pending}>
                {pending ? "Saving..." : "Save item"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
