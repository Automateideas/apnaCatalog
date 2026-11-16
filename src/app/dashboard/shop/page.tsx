import { requireShop } from "@/lib/auth";
import { ShopForm } from "./ShopForm";

export default async function ShopDetailsPage() {
  const { user, shop } = await requireShop();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Shop details</h1>
      <ShopForm
        userId={user.id}
        initial={{
          name: shop.name,
          businessType: shop.businessType,
          description: shop.description ?? "",
          city: shop.city,
          address: shop.address ?? "",
          phone: shop.phone ?? "",
          whatsapp: shop.whatsapp,
          ownerName: shop.ownerName ?? "",
          logoUrl: shop.logoUrl,
          ownerPhotoUrl: shop.ownerPhotoUrl,
          shopPhotoUrls: shop.shopPhotoUrls,
          lat: shop.lat,
          lng: shop.lng,
          mapsUrl: shop.mapsUrl ?? "",
        }}
      />
    </div>
  );
}
