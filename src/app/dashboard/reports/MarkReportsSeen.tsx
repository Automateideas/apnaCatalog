"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markReportsSeen } from "@/app/actions/reports";

/** Once the owner has opened the list, the bell count goes back to zero. */
export function MarkReportsSeen() {
  const router = useRouter();
  useEffect(() => {
    markReportsSeen()
      .then(() => router.refresh())
      .catch(() => {});
  }, [router]);
  return null;
}
