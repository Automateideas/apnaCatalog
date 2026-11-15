import { requireShop } from "@/lib/auth";
import { freePalettes, getBusinessType, isPaid } from "@/lib/catalog-config";
import { ThemeForm } from "./ThemeForm";

export default async function ThemePage() {
  const { shop } = await requireShop();
  const paid = isPaid(shop);
  const type = getBusinessType(shop.businessType);
  const allowed = freePalettes(shop.businessType);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Theme</h1>
      <ThemeForm
        paid={paid}
        freeLayout={type.layout}
        freePalettes={allowed}
        initial={{
          layout: paid ? shop.layout : type.layout,
          palette: paid || allowed.includes(shop.palette) ? shop.palette : type.palette,
          hideBranding: paid && shop.hideBranding,
        }}
      />
    </div>
  );
}
