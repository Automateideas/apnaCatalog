import { SITE_NAME } from "@/lib/utils";

export function GET() {
  return Response.json(
    {
      id: "/",
      name: `${SITE_NAME} - Online catalog for your shop`,
      short_name: SITE_NAME,
      description: "Make an online catalog for your shop and get orders on WhatsApp.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#1e3fae",
      icons: [
        { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      shortcuts: [{ name: "My shop", url: "/dashboard" }],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
