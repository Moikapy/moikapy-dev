"use client";

import { useState, useEffect } from "react";

/**
 * Shows a yellow banner when running in local dev mode with SQLite
 * instead of Cloudflare D1. Hidden in production.
 */
export function DevBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show in development
    setShow(process.env.NODE_ENV === "development");
  }, []);

  if (!show) return null;

  return (
    <div className="bg-yellow-500/90 text-yellow-950 text-center text-xs font-medium px-4 py-1.5">
      ⚡ Local dev mode — using SQLite instead of Cloudflare D1. Data is stored in <code className="font-mono">.local/dev.db</code>
    </div>
  );
}