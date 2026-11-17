"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateShop } from "@/app/actions/shop";
import { ImageUpload } from "@/components/ImageUpload";
import { ItemPhotos } from "@/components/ItemPhotos";
import { BUSINESS_TYPES, MAX_SHOP_PHOTOS } from "@/lib/catalog-config";
import { discardUploads } from "@/lib/upload";
import { Icon } from "@/components/Icon";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

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
  shopPhotoUrls: string[];
  lat: number | null;
  lng: number | null;
  mapsUrl: string;
};

export function ShopForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  // Shop photos the database has. Others in the list were uploaded here and not saved yet.
  const [savedShopPhotos, setSavedShopPhotos] = useState(initial.shopPhotoUrls);

  // Leaving the page without saving: delete the shop photos uploaded here, nothing uses them.
  const unsaved = useRef<string[]>([]);
  useEffect(() => {
    unsaved.current = v.shopPhotoUrls.filter((url) => !savedShopPhotos.includes(url));
  }, [v.shopPhotoUrls, savedShopPhotos]);
  useEffect(() => () => void discardUploads(unsaved.current), []);

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
        setSavedShopPhotos(v.shopPhotoUrls);
        router.refresh();
      } catch {
        setError("Could not save. Check your internet and try again.");
      }
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card className="space-y-4 p-5">
        <h2 className="font-bold text-slate-900">Shop</h2>
        <ImageUpload
          label="Shop logo (also used as the app icon on customers' phones)"
          kind="square"
          value={v.logoUrl}
          onChange={(url) => set("logoUrl", url)}
        />
        <div>
          <Label htmlFor="s-name">
            Shop name
          </Label>
          <Input
            id="s-name"
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
            required
            minLength={2}
            maxLength={60}
          />
        </div>
        <div>
          <Label htmlFor="s-type">
            Type of shop
          </Label>
          <NativeSelect
            id="s-type"
            value={v.businessType}
            onChange={(e) => set("businessType", e.target.value)}
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label htmlFor="s-description">
            About your shop (optional)
          </Label>
          <Textarea
            id="s-description"
            rows={2}
            value={v.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={300}
            placeholder="What you sell, since when, home delivery, timings..."
          />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-bold text-slate-900">Shop photos</h2>
        <p className="-mt-2 text-sm text-slate-600">
          Optional. Photos of your shop front and inside, so customers know they are at the right shop.
        </p>
        <ItemPhotos
          label="Photos of your shop"
          hint={`Up to ${MAX_SHOP_PHOTOS} photos. The first one is shown first.`}
          max={MAX_SHOP_PHOTOS}
          value={v.shopPhotoUrls}
          savedUrls={savedShopPhotos}
          onAdd={(url) => {
            setV((prev) => ({ ...prev, shopPhotoUrls: [...prev.shopPhotoUrls, url] }));
            setSaved(false);
          }}
          onChange={(urls) => set("shopPhotoUrls", urls)}
          onBusyChange={setUploading}
        />
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-bold text-slate-900">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="s-whatsapp">
              WhatsApp number (orders come here)
            </Label>
            <Input
              id="s-whatsapp"
              value={v.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              required
              type="tel"
              inputMode="numeric"
              maxLength={14}
            />
          </div>
          <div>
            <Label htmlFor="s-phone">
              Phone number for calls
            </Label>
            <Input
              id="s-phone"
              value={v.phone}
              onChange={(e) => set("phone", e.target.value)}
              type="tel"
              inputMode="numeric"
              maxLength={14}
              placeholder="Same as WhatsApp if empty"
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-bold text-slate-900">Owner</h2>
        <p className="-mt-2 text-sm text-slate-600">
          Optional. Customers trust a shop more when they can see who runs it.
        </p>
        <ImageUpload
          label="Your photo"
          kind="square"
          round
          value={v.ownerPhotoUrl}
          onChange={(url) => set("ownerPhotoUrl", url)}
        />
        <div>
          <Label htmlFor="s-owner">
            Your name
          </Label>
          <Input
            id="s-owner"
            value={v.ownerName}
            onChange={(e) => set("ownerName", e.target.value)}
            maxLength={60}
          />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="font-bold text-slate-900">Location</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="s-city">
              City
            </Label>
            <Input
              id="s-city"
              value={v.city}
              onChange={(e) => set("city", e.target.value)}
              required
              minLength={2}
              maxLength={40}
            />
          </div>
          <div>
            <Label htmlFor="s-address">
              Address
            </Label>
            <Input
              id="s-address"
              value={v.address}
              onChange={(e) => set("address", e.target.value)}
              maxLength={200}
              placeholder="Shop no., market, area"
            />
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Map location (for the Directions button)</span>
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
            <Button type="button" variant="outline" onClick={locate} disabled={locating}>
              <Icon name="pin" />
              {locating ? "Finding your location..." : "Use my current location"}
            </Button>
          )}
          <p className="mt-1 text-sm text-muted-foreground">Press this while you are standing inside your shop.</p>
        </div>

        <div>
          <Label htmlFor="s-maps">
            Or paste your Google Maps link
          </Label>
          <Input
            id="s-maps"
            value={v.mapsUrl}
            onChange={(e) => set("mapsUrl", e.target.value)}
            maxLength={500}
            type="url"
            placeholder="https://maps.app.goo.gl/..."
          />
        </div>
      </Card>

      {error && <Alert variant="destructive">{error}</Alert>}
      {saved && <Alert variant="success">Saved.</Alert>}

      <Button type="submit" className="w-full text-base sm:w-auto" disabled={pending || uploading}>
        {pending ? "Saving..." : uploading ? "Uploading photos..." : "Save changes"}
      </Button>
    </form>
  );
}
