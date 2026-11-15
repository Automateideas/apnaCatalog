import { ImageResponse } from "next/og";

const SIZES = [48, 72, 96, 144, 180, 192, 256, 384, 512];

export function parseIconSize(value: string | null | undefined): number {
  const size = Number(value);
  return SIZES.includes(size) ? size : 192;
}

/** PNG app icon: the shop's logo if it has one, otherwise letters on a colour. */
export function renderIcon(opts: {
  size: number;
  text: string;
  background: string;
  imageUrl?: string | null;
}) {
  const { size, text, background, imageUrl } = opts;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: imageUrl ? "#ffffff" : background,
          color: "#ffffff",
          fontSize: size * (text.length > 1 ? 0.42 : 0.56),
          fontWeight: 700,
          letterSpacing: -size * 0.01,
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img src={imageUrl} width={size} height={size} style={{ objectFit: "cover" }} />
        ) : (
          text
        )}
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" },
    },
  );
}
