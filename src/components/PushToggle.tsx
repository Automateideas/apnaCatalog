"use client";

import { useEffect, useState, useTransition } from "react";
import { BellOff, BellRing } from "lucide-react";
import { toast } from "sonner";
import { removePushSubscription, savePushSubscription, sendTestPush } from "@/app/actions/push";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/** The VAPID public key as the bytes the browser wants. */
function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

type State = "loading" | "unsupported" | "blocked" | "off" | "on";

/** "Turn on notifications" for new orders and reports, in this browser. */
export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!PUBLIC_KEY || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (!cancelled) setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("blocked");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const sub = await reg.pushManager.getSubscription();
      if (!cancelled) setState(sub ? "on" : "off");
    })().catch(() => !cancelled && setState("unsupported"));
    return () => {
      cancelled = true;
    };
  }, []);

  const turnOn = () =>
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setState(permission === "denied" ? "blocked" : "off");
          return;
        }
        const reg = await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUBLIC_KEY) }));
        const result = await savePushSubscription(JSON.parse(JSON.stringify(sub)));
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        setState("on");
        await sendTestPush();
        toast.success("Notifications are on. A test notification is on its way.");
      } catch {
        toast.error("Could not turn on notifications in this browser.");
      }
    });

  const turnOff = () =>
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await removePushSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
        setState("off");
        toast.success("Notifications are off on this phone.");
      } catch {
        toast.error("Could not turn off notifications.");
      }
    });

  if (state === "loading") return null;

  return (
    <Card className="flex flex-wrap items-center gap-3 p-4">
      {state === "on" ? <BellRing className="size-5 text-emerald-600" /> : <BellOff className="size-5 text-slate-500" />}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">
          {state === "on" ? "Notifications are on" : "Get notified of new orders and reports"}
        </p>
        <p className="text-sm text-slate-600">
          {state === "unsupported"
            ? "This browser cannot show notifications. On iPhone, add the site to your home screen first."
            : state === "blocked"
              ? "Notifications are blocked for this site. Allow them in your browser's site settings."
              : state === "on"
                ? "On this phone or computer. Turn on in each browser you use."
                : "Even when this page is closed. Works on this phone or computer."}
        </p>
      </div>
      {state === "off" && (
        <Button type="button" onClick={turnOn} disabled={pending}>
          {pending ? "Turning on..." : "Turn on"}
        </Button>
      )}
      {state === "on" && (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => startTransition(async () => void (await sendTestPush()))}>
            Send test
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={turnOff}>
            Turn off
          </Button>
        </div>
      )}
    </Card>
  );
}
