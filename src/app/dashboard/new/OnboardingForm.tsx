"use client";

import { useState, useTransition } from "react";
import { createShop } from "@/app/actions/shop";
import { BUSINESS_TYPES } from "@/lib/catalog-config";
import { slugify } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    <form onSubmit={submit} className="rounded-xl border bg-card space-y-4 p-5">
      <div>
        <Label htmlFor="shop-name">
          Shop name
        </Label>
        <Input
          id="shop-name"
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
        <Label htmlFor="shop-type">
          Type of shop
        </Label>
        <NativeSelect
          id="shop-type"
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
        </NativeSelect>
        <p className="mt-1 text-sm text-muted-foreground">We set up categories and a matching theme for you. You can change both.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="shop-city">
            City
          </Label>
          <Input
            id="shop-city"
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
          <Label htmlFor="shop-whatsapp">
            WhatsApp number
          </Label>
          <Input
            id="shop-whatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            required
            type="tel"
            inputMode="numeric"
            maxLength={14}
            placeholder="10-digit number"
            autoComplete="tel-national"
          />
          <p className="mt-1 text-sm text-muted-foreground">Orders from customers come to this number.</p>
        </div>
      </div>

      <div>
        <Label htmlFor="shop-slug">
          Your shop link
        </Label>
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
        <p className="mt-1 text-sm text-muted-foreground">
          This link goes on your QR code and cannot be changed later, so check the spelling.
        </p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}

      <Button type="submit" className="w-full text-base" disabled={pending}>
        {pending ? "Creating your shop..." : "Create my shop"}
      </Button>
    </form>
  );
}
