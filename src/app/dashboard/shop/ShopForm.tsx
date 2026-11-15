"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateShop } from "@/app/actions/shop";
import { ImageUpload } from "@/components/ImageUpload";
import { BUSINESS_TYPES } from "@/lib/catalog-config";
import { Icon } from "@/components/Icon";

type Values = {
  name: string;
  businessType: string;
  description: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  ownerName: string;
  logoUrl: string | null;
  ownerPhotoUrl: string | null;
  lat: number | null;
  lng: number | null;
  mapsUrl: string;
};

export function ShopForm({ userId, initial }: { userId: string; initial: Values }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setV((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const locate = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("This phone cannot share its location. Paste a Google Maps link instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setV((prev) => ({
          ...prev,
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        }));
        setSaved(false);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Could not get your location. Allow location access, or paste a Google Maps link.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const result = await updateShop(v);
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

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-slate-900">Shop</h2>
        <ImageUpload
          label="Shop logo (also used as the app icon on customers' phones)"
          kind="square"
          userId={userId}
          value={v.logoUrl}
          onChange={(url) => set("logoUrl", url)}
        />
        <div>
          <label className="label" htmlFor="s-name">
            Shop name
          </label>
          <input
            id="s-name"
            className="input"
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
            required
            minLength={2}
            maxLength={60}
          />
        </div>
        <div>
          <label className="label" htmlFor="s-type">
            Type of shop
          </label>
          <select
            id="s-type"
            className="input"
            value={v.businessType}
            onChange={(e) => set("businessType", e.target.value)}
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="s-description">
            About your shop (optional)
          </label>
          <textarea
            id="s-description"
            className="input"
            rows={2}
            value={v.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={300}
            placeholder="What you sell, since when, home delivery, timings..."
          />
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-slate-900">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-whatsapp">
              WhatsApp number (orders come here)
            </label>
            <input
              id="s-whatsapp"
              className="input"
              value={v.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              required
              type="tel"
              inputMode="numeric"
              maxLength={14}
            />
          </div>
          <div>
            <label className="label" htmlFor="s-phone">
              Phone number for calls
            </label>
            <input
              id="s-phone"
              className="input"
              value={v.phone}
              onChange={(e) => set("phone", e.target.value)}
              type="tel"
              inputMode="numeric"
              maxLength={14}
              placeholder="Same as WhatsApp if empty"
            />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-slate-900">Owner</h2>
        <p className="-mt-2 text-sm text-slate-600">
          Optional. Customers trust a shop more when they can see who runs it.
        </p>
        <ImageUpload
          label="Your photo"
          kind="square"
          round
          userId={userId}
          value={v.ownerPhotoUrl}
          onChange={(url) => set("ownerPhotoUrl", url)}
        />
        <div>
          <label className="label" htmlFor="s-owner">
            Your name
          </label>
          <input
            id="s-owner"
            className="input"
            value={v.ownerName}
            onChange={(e) => set("ownerName", e.target.value)}
            maxLength={60}
          />
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-slate-900">Location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="s-city">
              City
            </label>
            <input
              id="s-city"
              className="input"
              value={v.city}
              onChange={(e) => set("city", e.target.value)}
              required
              minLength={2}
              maxLength={40}
            />
          </div>
          <div>
            <label className="label" htmlFor="s-address">
              Address
            </label>
            <input
              id="s-address"
              className="input"
              value={v.address}
              onChange={(e) => set("address", e.target.value)}
              maxLength={200}
              placeholder="Shop no., market, area"
            />
          </div>
        </div>

        <div>
          <span className="label">Map location (for the Directions button)</span>
          {v.lat != null && v.lng != null ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                <Icon name="pin" /> Location set
              </span>
              <a
                href={`https://www.google.com/maps?q=${v.lat},${v.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand underline"
              >
                Check on map
              </a>
              <button
                type="button"
                className="text-slate-500 underline"
                onClick={() => setV((p) => ({ ...p, lat: null, lng: null }))}
              >
                Remove
              </button>
            </div>
          ) : (
            <button type="button" className="btn-outline" onClick={locate} disabled={locating}>
              <Icon name="pin" />
              {locating ? "Finding your location..." : "Use my current location"}
            </button>
          )}
          <p className="hint">Press this while you are standing inside your shop.</p>
        </div>

        <div>
          <label className="label" htmlFor="s-maps">
            Or paste your Google Maps link
          </label>
          <input
            id="s-maps"
            className="input"
            value={v.mapsUrl}
            onChange={(e) => set("mapsUrl", e.target.value)}
            maxLength={500}
            type="url"
            placeholder="https://maps.app.goo.gl/..."
          />
        </div>
      </section>

      {error && <p className="error-text">{error}</p>}
      {saved && <p className="ok-text">Saved.</p>}

      <button type="submit" className="btn-primary w-full text-base sm:w-auto" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
