"use client";

import { LayoutGrid, List, Rows3 } from "lucide-react";
import { ShopCard, type ShopCardData, type ShopView } from "@/components/ShopCard";
import { useStored } from "@/lib/use-stored";
import { cx } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const VIEWS: { id: ShopView; label: string; icon: typeof List }[] = [
  { id: "list", label: "List", icon: List },
  { id: "grid", label: "Grid with photos", icon: LayoutGrid },
  { id: "compact", label: "Compact, no photos", icon: Rows3 },
];

const GRID: Record<ShopView, string> = {
  list: "grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
  grid: "grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
  compact: "grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6",
};

/** The visitor's chosen view, remembered on this phone. */
export function useShopView(): [ShopView, (view: ShopView) => void] {
  const [raw, setRaw] = useStored("ac-shop-view");
  const view: ShopView = raw === "grid" || raw === "compact" ? raw : "list";
  return [view, (next) => setRaw(next === "list" ? null : next)];
}

/** Buttons to switch between list, grid and compact. */
export function ShopViewToggle({ className }: { className?: string }) {
  const [view, setView] = useShopView();
  return (
    <ToggleGroup
      value={[view]}
      onValueChange={(value: string[]) => value[0] && setView(value[0] as ShopView)}
      variant="outline"
      size="sm"
      aria-label="How to show shops"
      className={className}
    >
      {VIEWS.map(({ id, label, icon: Icon }) => (
        <ToggleGroupItem key={id} value={id} aria-label={label} title={label}>
          <Icon />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Shop cards in the visitor's chosen view. */
export function ShopList({
  shops,
  distances,
  className,
}: {
  shops: ShopCardData[];
  /** Distance line per shop slug ("Shops near me"). */
  distances?: Record<string, React.ReactNode>;
  className?: string;
}) {
  const [view] = useShopView();
  return (
    <div className={cx("grid", GRID[view], className)}>
      {shops.map((shop) => (
        <ShopCard key={shop.slug} shop={shop} view={view} distance={distances?.[shop.slug]} />
      ))}
    </div>
  );
}
