"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * The shop's visiting card on the dashboard. The card follows the shop's theme and colour, and
 * is also the preview WhatsApp shows under every shared shop link.
 */
export function VisitingCard({
  src,
  downloadSrc,
  fileName,
  shareText,
}: {
  /** Card image address (with its version). */
  src: string;
  downloadSrc: string;
  fileName: string;
  /** Message sent with the card, shop link included. */
  shareText: string;
}) {
  const [busy, setBusy] = useState(false);

  function download() {
    const a = document.createElement("a");
    a.href = downloadSrc;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function share() {
    setBusy(true);
    try {
      const blob = await fetch(src).then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.blob();
      });
      const file = new File([blob], fileName, { type: "image/png" });
      // Phones (Android Chrome, iPhone Safari) can send the picture and the text together,
      // straight into a WhatsApp chat. Elsewhere the card is saved instead.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
      } else {
        download();
        toast.success("Card saved. Attach it in WhatsApp with your catalog link.");
      }
    } catch (error) {
      // The person closed the share sheet: nothing to do.
      if (error instanceof DOMException && error.name === "AbortError") return;
      download();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="font-bold text-slate-900">Your visiting card</h2>
      <p className="mt-1 text-sm text-slate-600">
        Made from your business details in your theme and colour. It shows up by itself when you share
        your catalog link on WhatsApp. Change the theme and the card changes too.
      </p>
      <img
        src={src}
        alt="Your visiting card"
        width={1200}
        height={630}
        className="mt-3 h-auto w-full rounded-lg border bg-slate-50"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="whatsapp" onClick={share} disabled={busy}>
          {busy ? "Opening…" : "Share card"}
        </Button>
        <a href={downloadSrc} download={fileName} className={buttonVariants({ variant: "outline" })}>
          Download visiting card
        </a>
      </div>
    </Card>
  );
}
