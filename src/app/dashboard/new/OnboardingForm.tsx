"use client";

import { useState, useTransition } from "react";
import { createShop } from "@/app/actions/shop";
import { BUSINESS_TYPES } from "@/lib/catalog-config";
import { slugify } from "@/lib/utils";

export function OnboardingForm({ host }: { host: string }) {
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const slug = customSlug ?? slugify(name);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      // On success the server redirects to the dashboard.
      const result = await createShop({
        name,
        businessType,
        city,
        whatsapp,
        slug: customSlug ? slugify(customSlug) : undefined,
      });
      if (result && !result.ok) setError(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5">
      <div>
        <label className="label" htmlFor="shop-name">
          Shop name
        </label>
        <input
          id="shop-name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={60}
          placeholder="Hemkund Gift Store"
          autoFocus
        />
      </div>

      <div>
        <label className="label" htmlFor="shop-type">
          Type of shop
        </label>
        <select
          id="shop-type"
          className="input"
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          required
        >
          <option value="" disabled>
            Choose one
          </option>
          {BUSINESS_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <p className="hint">We set up categories and a matching theme for you. You can change both.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="shop-city">
            City
          </label>
          <input
            id="shop-city"
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            minLength={2}
            maxLength={40}
            placeholder="Dehradun"
            autoComplete="address-level2"
          />
        </div>
        <div>
          <label className="label" htmlFor="shop-whatsapp">
            WhatsApp number
          </label>
          <input
            id="shop-whatsapp"
            className="input"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            required
            type="tel"
            inputMode="numeric"
            maxLength={14}
            placeholder="10-digit number"
            autoComplete="tel-national"
          />
          <p className="hint">Orders from customers come to this number.</p>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="shop-slug">
          Your shop link
        </label>
        <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-slate-50 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <span className="pl-3 text-sm whitespace-nowrap text-slate-500">{host}/</span>
          <input
            id="shop-slug"
            className="min-h-11 w-full bg-transparent px-1 py-2 text-base outline-none"
            value={slug}
            onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            maxLength={50}
            placeholder="your-shop-name"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
        <p className="hint">
          This link goes on your QR code and cannot be changed later, so check the spelling.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn-primary w-full text-base" disabled={pending}>
        {pending ? "Creating your shop..." : "Create my shop"}
      </button>
    </form>
  );
}
