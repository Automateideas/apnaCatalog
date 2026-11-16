"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useStored } from "@/lib/use-stored";
import { Icon } from "@/components/Icon";

type InstallEvent = Event & { prompt: () => Promise<void> };

const noop = () => () => {};

function isIosBrowser(): boolean {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

/** Small "add to home screen" strip. Android shows a button, iPhone shows the steps. */
export function InstallHint({ name }: { name: string }) {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [dismissed, setDismissed] = useStored("ac-install-dismissed");
  const ios = useSyncExternalStore(noop, isIosBrowser, () => false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (dismissed || (!installEvent && !ios)) return null;

  return (
    <div className="no-print mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
      <p className="text-slate-700">
        {installEvent ? (
          <>
            Keep <strong>{name}</strong> on your home screen for quick ordering.
          </>
        ) : (
          <>
            To keep <strong>{name}</strong> on your home screen: tap <strong>Share</strong>, then{" "}
            <strong>Add to Home Screen</strong>.
          </>
        )}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        {installEvent && (
          <button
            type="button"
            className="rounded-lg bg-(--p,#1b2340) px-3 py-1.5 font-semibold text-white"
            onClick={async () => {
              await installEvent.prompt();
              setInstallEvent(null);
            }}
          >
            Add
          </button>
        )}
        <button
          type="button"
          className="rounded-lg px-2 py-1.5 text-slate-400 hover:bg-slate-100"
          aria-label="Dismiss"
          onClick={() => setDismissed("1")}
        >
          <Icon name="x" />
        </button>
      </div>
    </div>
  );
}
