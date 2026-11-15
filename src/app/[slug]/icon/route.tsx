import type { NextRequest } from "next/server";
import { effectiveTheme } from "@/lib/catalog-config";
import { parseIconSize, renderIcon } from "@/lib/icon";
import { getPublicShop } from "@/lib/shop-data";
import { initials } from "@/lib/utils";

export async function GET(request: NextRequest, ctx: RouteContext<"/[slug]/icon">) {
  const { slug } = await ctx.params;
  const shop = await getPublicShop(slug);
  if (!shop) return new Response("Not found", { status: 404 });

  const { palette } = effectiveTheme(shop);
  return renderIcon({
    size: parseIconSize(request.nextUrl.searchParams.get("size")),
    text: initials(shop.name),
    background: palette.primary,
    imageUrl: shop.logoUrl,
  });
}
