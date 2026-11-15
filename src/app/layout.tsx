import type { Metadata, Viewport } from "next";
import { Baloo_2, Mukta } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import { SITE_NAME, siteUrl } from "@/lib/utils";
import "./globals.css";

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
  icons: { icon: "/app-icon/192", apple: "/app-icon/180" },
  openGraph: { siteName: SITE_NAME, type: "website", locale: "en_IN" },
};

export const viewport: Viewport = {
  themeColor: "#1e3fae",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${baloo.variable} ${mukta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
