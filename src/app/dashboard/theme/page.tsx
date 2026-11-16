import { requireShop } from "@/lib/auth";
import { isPaid } from "@/lib/catalog-config";
import { resolveTheme, themeForType } from "@/lib/themes";
import { ThemeForm } from "./ThemeForm";

export default async function ThemePage() {
  const { shop } = await requireShop();
  const paid = isPaid(shop);
  const { theme, accent } = resolveTheme(shop);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Theme</h1>
      <ThemeForm
        paid={paid}
        shopName={shop.name}
        shopSlug={shop.slug}
        recommended={themeForType(shop.businessType).id}
        businessType={shop.businessType}
        hasShopPhotos={shop.shopPhotoUrls.length > 0}
        initial={{ theme: theme.id, accent: accent.id, hideBranding: paid && shop.hideBranding }}
      />
    </div>
  );
}
