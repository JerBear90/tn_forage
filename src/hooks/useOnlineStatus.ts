"use client";

import { useState, useEffect, useSyncExternalStore } from "react";

/**
 * Subscribes to the browser's online/offline events and returns the current
 * connectivity status.
 *
 * - Returns `true` on the server (SSR) to avoid hydration mismatches.
 * - Uses `useSyncExternalStore` for tear-free reads of `navigator.onLine`.
 */

function subscribe(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot(): boolean {
  return navigator.onLine;
}

function getServerSnapshot(): boolean {
  // Default to online during SSR to avoid flash of offline badge
  return true;
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
