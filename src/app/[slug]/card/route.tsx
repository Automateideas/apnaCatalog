import type { NextRequest } from "next/server";
import { getPublicShop } from "@/lib/shop-data";
import { renderVisitingCard } from "@/lib/visiting-card";

/** The shop's visiting card as a PNG. `?download=1` saves it as a file. */
export async function GET(request: NextRequest, ctx: RouteContext<"/[slug]/card">) {
  const { slug } = await ctx.params;
  let shop = await getPublicShop(slug);
  if (!shop) return new Response("Not found", { status: 404 });

  const params = request.nextUrl.searchParams;
  // Local development only: try any theme with ?theme=<id>&accent=<id>.
  if (process.env.NODE_ENV === "development" && params.get("theme")) {
    shop = { ...shop, theme: params.get("theme"), palette: params.get("accent") ?? "" };
  }
  try {
    return await renderVisitingCard(shop, {
      download: params.get("download") === "1",
      // Addresses with the version are never reused for another design, so they can be kept long.
      immutable: params.has("v"),
    });
  } catch (error) {
    console.error("visiting card failed", slug, error);
    return new Response("Could not make the card", { status: 500 });
  }
}
