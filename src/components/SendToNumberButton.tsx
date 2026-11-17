"use client";

import { promptDialog } from "@/components/dialogs";
import { Button } from "@/components/ui/button";
import { normalizePhone, waLink } from "@/lib/utils";

type ButtonProps = React.ComponentProps<typeof Button>;

/**
 * Sends a message to one WhatsApp number that is not saved in the phone's contacts.
 * Asks for the number, then opens that person's WhatsApp chat with the text filled in.
 */
export function SendToNumberButton({
  text,
  label = "Send to a number",
  variant = "outline",
  size,
  className,
}: {
  /** The message to send, link included. */
  text: string;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={async () => {
        const entered = await promptDialog({
          title: "Send on WhatsApp",
          description: "Type the customer's WhatsApp number. Their chat opens with the link ready to send.",
          label: "WhatsApp number",
          type: "tel",
          placeholder: "98765 43210",
          maxLength: 16,
          confirmLabel: "Open WhatsApp",
          validate: (value) => (normalizePhone(value) ? null : "Enter a 10-digit mobile number."),
        });
        const phone = normalizePhone(entered);
        if (!phone) return;
        const url = waLink(phone, text);
        // "noopener" in window.open always returns null, which looked like a blocked tab and sent
        // this page to WhatsApp as well. Open plainly, cut the link back to this page, and only
        // fall back to this tab when the browser really blocked the new one.
        const tab = window.open(url, "_blank");
        if (tab) tab.opener = null;
        else window.location.href = url;
      }}
    >
      {label}
    </Button>
  );
}
