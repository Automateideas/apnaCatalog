"use client";

import { useEffect, useState } from "react";
import { Loader2, LocateFixed, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { nearbyShops, type NearbyShop } from "@/app/actions/nearby";
import { ShopList } from "@/components/ShopList";
import { Button } from "@/components/ui/button";
import {
  currentPosition,
  formatMeters,
  formatRoad,
  locationAllowed,
  locationError,
  type Road,
  roadDistancesAuto,
} from "@/lib/distance";

/**
 * "Shops near me": asks for the customer's location only when they tap the button, then lists the
 * closest shops with their distance. The straight-line distance shows at once; the road distance
 * from Mapbox replaces it a moment later. Until the button is used, the normal list (children) shows.
 */
export function NearbyShops({
  type,
  q,
  children,
}: {
  type: string;
  q: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<"off" | "locating" | "on">("off");
  const [list, setList] = useState<NearbyShop[]>([]);
  const [roads, setRoads] = useState<Map<string, Road>>(new Map());

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
    const result = await nearbyShops({ ...from, type, q }).catch(() => ({ ok: false as const }));
    if (!result.ok) {
      setState("off");
      toast.error("Could not find shops near you. Check your internet and try again.");
      return;
    }
    setList(result.shops);
    setRoads(new Map());
    setState("on");
    // If Mapbox fails, the straight-line distance simply stays.
    setRoads(await roadDistancesAuto(from, result.shops.map((s) => ({ ...s, id: s.slug }))));
  };

  // If the customer already allowed location before, show nearby shops straight away.
  useEffect(() => {
    let cancelled = false;
    locationAllowed().then((ok) => {
      if (ok && !cancelled) start();
    });
    return () => {
      cancelled = true;
    };
    // Runs once per filter change; start() reads the latest filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, q]);

  const sorted = [...list].sort(
    (a, b) => (roads.get(a.slug)?.meters ?? a.meters) - (roads.get(b.slug)?.meters ?? b.meters),
  );

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {state === "on" ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setState("off")}>
            <X /> Show all shops
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={start} disabled={state === "locating"}>
            {state === "locating" ? <Loader2 className="animate-spin" /> : <LocateFixed />}
            {state === "locating" ? "Finding your location..." : "Shops near me"}
          </Button>
        )}
        {state === "on" && (
          <span className="text-sm text-slate-500">Closest first. Only shops that set their map location.</span>
        )}
      </div>

      {state !== "on" && children}

      {state === "on" && sorted.length === 0 && (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
          No shops with a map location match this search yet.
        </p>
      )}

      {state === "on" && sorted.length > 0 && (
        <ShopList
          className="mt-4"
          shops={sorted}
          distances={Object.fromEntries(
            sorted.map((shop) => {
              const road = roads.get(shop.slug);
              return [
                shop.slug,
                <>
                  <MapPin className="size-3.5 shrink-0" />
                  {road ? formatRoad(road) : `~${formatMeters(shop.meters)} away`}
                </>,
              ];
            }),
          )}
        />
      )}
    </>
  );
}
