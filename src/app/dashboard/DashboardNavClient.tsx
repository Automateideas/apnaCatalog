"use client";

import dynamic from "next/dynamic";

export const DashboardNav = dynamic(
  () => import("./DashboardNav").then((m) => m.DashboardNav),
  { ssr: false },
);

export const DashboardSidebar = dynamic(
  () => import("./DashboardNav").then((m) => m.DashboardSidebar),
  { ssr: false },
);
