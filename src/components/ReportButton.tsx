"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { createReport } from "@/app/actions/reports";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { cx } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** "Report this shop / item": asks why, then sends it to the shop owner and the Apnacatalog team. */
export function ReportButton({
  shopId,
  itemId,
  what,
  className,
}: {
  shopId: string;
  itemId?: string;
  /** "shop" or "item", for the wording. */
  what: "shop" | "item";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason) {
      setError("Choose a reason.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await createReport({ shopId, itemId, reason, details, contact });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setOpen(false);
        setReason("");
        setDetails("");
        setContact("");
        toast.success("Thank you. Our team will check it within 24 hours.");
      } catch {
        setError("Could not send. Check your internet and try again.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx("inline-flex items-center gap-1.5 text-sm text-(--t-muted) hover:text-(--t-text) hover:underline", className)}
      >
        <Flag className="size-3.5" aria-hidden="true" /> Report this {what}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={send} className="space-y-4">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">Report this {what}</DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Tell us what is wrong. The shop owner and our team will see it.
              </DialogDescription>
            </div>

            <fieldset className="space-y-1.5">
              <legend className="mb-1 text-sm font-medium text-slate-900">Reason</legend>
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  className={cx(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm",
                    reason === r.id ? "border-brand bg-brand-soft" : "border-slate-200",
                  )}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={() => setReason(r.id)}
                    className="accent-[#1b2340]"
                  />
                  <span className="text-slate-800">{r.label}</span>
                </label>
              ))}
            </fieldset>

            <div>
              <Label htmlFor="report-details">What did you see? (optional)</Label>
              <Textarea id="report-details" rows={3} maxLength={1000} value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="report-contact">Your phone or email (optional)</Label>
              <Input
                id="report-contact"
                maxLength={100}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                aria-describedby="report-contact-hint"
              />
              <p id="report-contact-hint" className="mt-1 text-xs text-slate-500">
                Only our team sees this, in case we need to ask you something.
              </p>
            </div>

            {error && <p className="text-sm font-medium text-red-700">{error}</p>}

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={pending}>
                {pending ? "Sending..." : "Send report"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
