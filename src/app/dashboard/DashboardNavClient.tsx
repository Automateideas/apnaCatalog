"use client";

import dynamic from "next/dynamic";

export const DashboardNav = dynamic(
  () => import("./DashboardNav").then((m) => m.DashboardNav),
  { ssr: false },
);
