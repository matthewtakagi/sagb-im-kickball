"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LivePoller({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => router.refresh(), 2500);
    return () => clearInterval(id);
  }, [enabled, router]);
  return null;
}
