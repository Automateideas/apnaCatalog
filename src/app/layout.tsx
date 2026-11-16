import type { Metadata, Viewport } from "next";
import { Baloo_2, Mukta } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import { SITE_NAME, siteUrl } from "@/lib/utils";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Both families include Devanagari, so Hindi shop and item names match the Latin text.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "devanagari"],
  weight: ["600", "700", "800"],
  display: "swap",
});
const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} - Online catalog for your shop`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Make a free online catalog for your shop in 2 minutes. Share one link, get orders on WhatsApp. Find local shops in your city.",
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_IN" },
};

export const viewport: Viewport = {
  themeColor: "#1B2340",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${baloo.variable} ${mukta.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col"
        cz-shortcut-listen="true"
        data-new-gr-c-s-check-loaded="14.1347.0"
        data-gr-ext-installed=""
      >
        <SpeedInsights />
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
