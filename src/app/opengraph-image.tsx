import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/utils";

// The preview card shown when the site link is shared on WhatsApp, Facebook or X.
export const alt = `${SITE_NAME}: your city's businesses, with prices, on your phone`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#1B2340",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* The real mark and wordmark, dark version (public/logo-dark.svg). */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="84" height="84" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="26" fill="#F29A1F" />
            <circle cx="46" cy="54" r="21" fill="none" stroke="#1B2340" strokeWidth="11" />
            <rect x="62" y="20" width="11" height="68" rx="5.5" fill="#1B2340" />
            <circle cx="67.5" cy="28" r="4.5" fill="#F29A1F" />
          </svg>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700, letterSpacing: -1, color: "#FBF7F0" }}>
            apna<span style={{ fontWeight: 400, color: "#F29A1F" }}>catalog</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>
            Your city&apos;s businesses, with prices, on your phone.
          </div>
          <div style={{ fontSize: 34, color: "rgba(251,247,240,0.75)" }}>
            See the catalog. Order on WhatsApp. Free for all businesses.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
