import { effectiveTheme } from "@/lib/catalog-config";
import { getPublicShop } from "@/lib/shop-data";

/** Each shop is its own installable app, with the shop's name and icon. */
export async function GET(_request: Request, ctx: RouteContext<"/[slug]/manifest.webmanifest">) {
  const { slug } = await ctx.params;
  const shop = await getPublicShop(slug);
  if (!shop) return new Response("Not found", { status: 404 });

  const { palette } = effectiveTheme(shop);
  const icon = (size: number) => `/${shop.slug}/icon?size=${size}`;

  return Response.json(
    {
      id: `/${shop.slug}`,
      name: shop.name,
      short_name: shop.name.slice(0, 24),
      description: shop.description ?? `Catalog of ${shop.name}, ${shop.city}`,
      start_url: `/${shop.slug}`,
      scope: `/${shop.slug}`,
      display: "standalone",
      background_color: "#ffffff",
      theme_color: palette.primary,
      icons: [
        { src: icon(192), sizes: "192x192", type: "image/png", purpose: "any" },
        { src: icon(512), sizes: "512x512", type: "image/png", purpose: "any" },
      ],
    },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
