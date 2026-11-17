"use client";

import { useEffect, useState } from "react";
import { Loader2, LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  currentPosition,
  formatMeters,
  formatRoad,
  locationAllowed,
  locationError,
  type Road,
  roadDistancesAuto,
  straightMeters,
} from "@/lib/distance";

/**
 * How far the shop is from the customer. Shows by itself when the customer already allowed
 * location; otherwise a small "How far is it?" link asks first, so no popup appears on page load.
 */
export function ShopDistance({ lat, lng, directions }: { lat: number; lng: number; directions: string | null }) {
  const [state, setState] = useState<"off" | "locating" | "on">("off");
  const [straight, setStraight] = useState(0);
  const [road, setRoad] = useState<Road | null>(null);

  const start = async () => {
    setState("locating");
    let from;
    try {
      from = await currentPosition();
    } catch (error) {
      setState("off");
      toast.error(locationError(error));
      return;
    }
    const meters = straightMeters(from, { lat, lng });
    setStraight(meters);
    setState("on");
    const roads = await roadDistancesAuto(from, [{ id: "shop", lat, lng, meters }]);
    setRoad(roads.get("shop") ?? null);
  };

  useEffect(() => {
    let cancelled = false;
    locationAllowed().then((ok) => {
      if (ok && !cancelled) start();
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  if (state !== "on") {
    return (
      <button
        type="button"
        onClick={start}
        disabled={state === "locating"}
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-(--t-muted) underline-offset-2 hover:text-(--t-text) hover:underline"
      >
        {state === "locating" ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
        {state === "locating" ? "Finding your location..." : "How far is this shop from me?"}
      </button>
    );
  }

  const text = road ? `${formatRoad(road)} from you` : `About ${formatMeters(straight)} from you`;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-sm text-(--t-text)">
      <MapPin className="size-4 shrink-0 text-(--p)" />
      <span className="font-semibold">{text}</span>
      {directions && (
        <a href={directions} target="_blank" rel="noopener noreferrer" className="text-(--t-muted) underline underline-offset-2">
          Get directions
        </a>
      )}
    </p>
  );
}
