"use client";

import { useState } from "react";
import Link from "next/link";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  adminSetShopHidden,
  adminSetShopPlan,
  adminSetShopTier,
} from "@/app/actions/admin";
import { ActionButton } from "@/components/ActionButton";
import { LoginEmailButton } from "./LoginEmailButton";
import { PlanDateButton } from "./PlanDateButton";
import { DeleteShopButton } from "./DeleteShopButton";
import {
  getBusinessType,
  isPaid,
  PAID_PLAN_IDS,
  planOf,
  PLANS,
} from "@/lib/catalog-config";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminShopRow = {
  id: string;
  slug: string;
  name: string;
  businessType: string;
  city: string;
  ownerEmail: string | null;
  pendingOwnerEmail: string | null;
  whatsapp: string;
  itemCount: number;
  plan: string;
  planExpiresAt: string | null;
  isHidden: boolean;
  createdAt: string;
  inviterSlug: string | null;
  inviteRewardedAt: string | null;
};

function dateInIndia(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    date,
  );
}

function SortableHeader({
  column,
  children,
}: {
  column: {
    toggleSorting: (desc?: boolean) => void;
    getIsSorted: () => false | "asc" | "desc";
  };
  children: React.ReactNode;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      className="flex items-center gap-1 font-medium hover:text-slate-900"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {children}
      <ArrowUpDown
        className={`size-3.5 ${sorted ? "text-brand" : "text-slate-400"}`}
      />
    </button>
  );
}

const columns: ColumnDef<AdminShopRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>Shop</SortableHeader>
    ),
    cell: ({ row }) => {
      const shop = row.original;
      return (
        <div className="min-w-45">
          <Link
            href={`/${shop.slug}`}
            target="_blank"
            className="font-medium text-brand underline"
          >
            {shop.name}
          </Link>
          <p className="text-xs text-slate-500">
            /{shop.slug} · {getBusinessType(shop.businessType).name} ·{" "}
            {shop.city}
          </p>
          <p className="text-xs text-slate-400">
            Joined {formatDate(new Date(shop.createdAt))}
          </p>
          {shop.inviterSlug && (
            <p className="text-xs text-slate-500">
              Invited by /{shop.inviterSlug} ·{" "}
              {shop.inviteRewardedAt
                ? `free month given ${formatDate(new Date(shop.inviteRewardedAt))}`
                : "inviter gets free month on first paid plan"}
            </p>
          )}
          {shop.isHidden && (
            <Badge variant="destructive" className="mt-1">
              Hidden
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, _columnId, filterValue: string) => {
      const shop = row.original;
      const q = filterValue.toLowerCase();
      return (
        shop.name.toLowerCase().includes(q) ||
        shop.slug.toLowerCase().includes(q) ||
        shop.city.toLowerCase().includes(q) ||
        (shop.ownerEmail ?? "").toLowerCase().includes(q) ||
        shop.whatsapp.includes(q)
      );
    },
  },
  {
    accessorKey: "ownerEmail",
    header: "Owner",
    cell: ({ row }) => {
      const shop = row.original;
      return (
        <div className="min-w-35 text-xs text-slate-600">
          <p>{shop.ownerEmail ?? "-"}</p>
          {shop.pendingOwnerEmail && (
            <p className="text-amber-700">Moving to {shop.pendingOwnerEmail}</p>
          )}
          <p>+91 {shop.whatsapp}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "itemCount",
    header: ({ column }) => (
      <SortableHeader column={column}>Items</SortableHeader>
    ),
    cell: ({ getValue }) => (
      <span className="tabular-nums">{getValue<number>()}</span>
    ),
  },
  {
    accessorKey: "plan",
    header: ({ column }) => (
      <SortableHeader column={column}>Plan</SortableHeader>
    ),
    cell: ({ row }) => {
      const shop = row.original;
      const planFields = {
        plan: shop.plan,
        planExpiresAt: shop.planExpiresAt ? new Date(shop.planExpiresAt) : null,
      };
      const paid = isPaid(planFields);
      const plan = planOf(planFields);
      return (
        <div className="min-w-20">
          <span
            className={
              paid ? "font-semibold text-emerald-700" : "text-slate-600"
            }
          >
            {plan.name}
          </span>
          {paid && shop.planExpiresAt && (
            <p className="text-xs text-slate-500">
              till {formatDate(new Date(shop.planExpiresAt))}
            </p>
          )}
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const order = ["free", "starter", "pro", "business"];
      return (
        order.indexOf(rowA.original.plan) - order.indexOf(rowB.original.plan)
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column}>Joined</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-slate-500">
        {formatDate(new Date(row.original.createdAt))}
      </span>
    ),
    sortingFn: (rowA, rowB) =>
      new Date(rowA.original.createdAt).getTime() -
      new Date(rowB.original.createdAt).getTime(),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const shop = row.original;
      const planFields = {
        plan: shop.plan,
        planExpiresAt: shop.planExpiresAt ? new Date(shop.planExpiresAt) : null,
      };
      const paid = isPaid(planFields);
      const currentPlan = planOf(planFields);
      return (
        <div className="min-w-50 space-y-2.5">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Plan
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <ActionButton
                size="xs"
                action={adminSetShopPlan.bind(null, shop.id, 1)}
                confirm={`Add 1 month of the paid plan to ${shop.name}?`}
                success={`Added 1 month to ${shop.name}.`}
              >
                +1 month
              </ActionButton>
              <ActionButton
                size="xs"
                action={adminSetShopPlan.bind(null, shop.id, 12)}
                confirm={`Add 1 year of the paid plan to ${shop.name}?`}
                success={`Added 1 year to ${shop.name}.`}
              >
                +1 year
              </ActionButton>
              <PlanDateButton
                shopId={shop.id}
                shopName={shop.name}
                currentDate={
                  paid && shop.planExpiresAt
                    ? dateInIndia(new Date(shop.planExpiresAt))
                    : null
                }
              />
              {paid &&
                PAID_PLAN_IDS.filter((id) => id !== currentPlan.id).map(
                  (id) => (
                    <ActionButton
                      key={id}
                      size="xs"
                      action={adminSetShopTier.bind(null, shop.id, id)}
                      confirm={`Switch ${shop.name} to the ${PLANS[id].name} plan? The end date stays the same.`}
                      success={`${shop.name} is now on ${PLANS[id].name}.`}
                    >
                      {PLANS[id].name}
                    </ActionButton>
                  ),
                )}
              {shop.plan !== "free" && (
                <ActionButton
                  size="xs"
                  action={adminSetShopPlan.bind(null, shop.id, 0)}
                  confirm={`Move ${shop.name} to the free plan now?`}
                  destructive
                  success={`${shop.name} is now on the free plan.`}
                >
                  Make free
                </ActionButton>
              )}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Account
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <LoginEmailButton
                shopId={shop.id}
                shopName={shop.name}
                pendingEmail={shop.pendingOwnerEmail}
              />
              <ActionButton
                size="xs"
                action={adminSetShopHidden.bind(null, shop.id, !shop.isHidden)}
                confirm={
                  shop.isHidden
                    ? `Show ${shop.name} to the public again?`
                    : `Hide ${shop.name}? Customers will not be able to open it.`
                }
                destructive={!shop.isHidden}
              >
                {shop.isHidden ? "Unhide" : "Hide"}
              </ActionButton>
              <DeleteShopButton
                shopId={shop.id}
                shopName={shop.name}
                slug={shop.slug}
              />
            </div>
          </div>
        </div>
      );
    },
  },
];

export function AdminShopsTable({ data }: { data: AdminShopRow[] }) {
  "use no memo";
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const shop = row.original;
      const q = filterValue.toLowerCase();
      return (
        shop.name.toLowerCase().includes(q) ||
        shop.slug.toLowerCase().includes(q) ||
        shop.city.toLowerCase().includes(q) ||
        (shop.ownerEmail ?? "").toLowerCase().includes(q) ||
        shop.whatsapp.includes(q)
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-slate-900">
          Shops
          <span className="ml-2 text-sm font-normal text-slate-500">
            ({table.getFilteredRowModel().rows.length})
          </span>
        </h2>
        <Input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs min-h-9 py-1.5 text-sm"
          placeholder="Filter by name, link, city, email, phone"
          aria-label="Filter shops"
        />
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table className="w-full min-w-200 text-sm">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-slate-50 text-left text-slate-500"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-3 py-2.5">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="align-top transition-colors hover:bg-slate-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="px-3 py-8 text-center text-slate-500"
                >
                  No shops found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-4 text-sm text-slate-600">
        <p>
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount() || 1}
          <span className="ml-2 text-slate-400">
            ({table.getFilteredRowModel().rows.length} shops)
          </span>
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
