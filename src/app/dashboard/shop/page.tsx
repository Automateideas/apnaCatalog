import { requireShop } from "@/lib/auth";
import { ShopForm } from "./ShopForm";

export default async function ShopDetailsPage() {
  const { shop } = await requireShop();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Shop details</h1>
      <ShopForm
        initial={{
          name: shop.name,
          businessType: shop.businessType,
          description: shop.description ?? "",
          state: shop.state ?? "",
          city: shop.city,
          address: shop.address ?? "",
          phone: shop.phone ?? "",
          whatsapp: shop.whatsapp,
          ownerName: shop.ownerName ?? "",
          reraNumber: shop.reraNumber ?? "",
          logoUrl: shop.logoUrl,
          ownerPhotoUrl: shop.ownerPhotoUrl,
          shopPhotoUrls: shop.shopPhotoUrls,
          lat: shop.lat,
          lng: shop.lng,
          mapsUrl: shop.mapsUrl ?? "",
          instagram: shop.instagram ?? "",
          facebook: shop.facebook ?? "",
          youtube: shop.youtube ?? "",
          businessHours: shop.businessHours ?? null,
          announcement: shop.announcement ?? "",
          announcementActive: shop.announcementActive,
        }}
      />
    </div>
  );
}
