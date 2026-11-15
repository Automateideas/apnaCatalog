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
      theme_color: "#1B2340",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      ],
      shortcuts: [{ name: "My shop", url: "/dashboard" }],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
