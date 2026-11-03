"use client";

import { useEffect } from "react";

export function ScrollToId({
  id,
  enabled = true,
}: {
  id: string;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;
    const node = document.getElementById(id);
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [enabled, id]);

  return null;
}
