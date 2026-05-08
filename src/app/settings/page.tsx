"use client";

import { useState } from "react";
import Link from "next/link";
import { generateDataExport, downloadExportAsFile } from "@/utils/dataExport";
import { deleteAccount, revokeSession } from "@/utils/accountDeletion";
import { useFeedback } from "@/components/FeedbackProvider";

/**
 * Settings page with analytics, push notifications, legal links, export, and delete.
 * Requirements: 20.4, 21.3, 22, 23
 */
export default function SettingsPage() {
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [blogNotifications, setBlogNotifications] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { openFeedback } = useFeedback();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await generateDataExport("current-user");
      downloadExportAsFile(data);
    } catch {
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm("This will clear all offline data (species, parks, etc.) and reload it fresh. Your posts and account are safe. Continue?")) return;
    setIsResetting(true);
    try {
      // Delete the IndexedDB database entirely
      const { getDB } = await import("@/offline/db");
      const db = await getDB();
      db.close();
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase("foragewise-db");
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve(); // proceed anyway
      });
      // Also clear service worker caches
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      // Unregister service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
      // Reload the page — DataLoader will re-seed everything
      window.location.reload();
    } catch {
      alert("Reset failed. Try clearing your browser data manually.");
      setIsResetting(false);
    }
  };

  const handleDelete = async () => {
    const result = await deleteAccount("current-user");
    if (result.success) {
      await revokeSession();
      window.location.href = "/login";
    } else {
      alert("Account deletion encountered errors. Some data may remain.");
    }
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-brand-charcoal dark:text-brand-sand mb-6">Settings</h1>

      {/* Analytics */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-2">Privacy</h2>
        <label className="flex items-center justify-between rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-3">
          <span className="text-sm text-brand-charcoal dark:text-brand-sand">Opt out of usage analytics</span>
          <input
            type="checkbox"
            checked={analyticsOptOut}
            onChange={(e) => setAnalyticsOptOut(e.target.checked)}
            className="rounded border-brand-charcoal/10 dark:border-brand-sand/10"
          />
        </label>
      </section>

      {/* Notifications */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-2">Notifications</h2>
        <div className="space-y-2">
          <label className="flex items-center justify-between rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-3">
            <span className="text-sm text-brand-charcoal dark:text-brand-sand">Push notifications</span>
            <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} className="rounded border-brand-charcoal/10 dark:border-brand-sand/10" />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-3">
            <span className="text-sm text-brand-charcoal dark:text-brand-sand">New blog article alerts</span>
            <input type="checkbox" checked={blogNotifications} onChange={(e) => setBlogNotifications(e.target.checked)} className="rounded border-brand-charcoal/10 dark:border-brand-sand/10" />
          </label>
        </div>
      </section>

      {/* Legal */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-2">Legal</h2>
        <div className="space-y-2">
          <Link href="/terms" className="block rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-3 text-sm text-brand-charcoal dark:text-brand-sand hover:bg-brand-charcoal/5 dark:hover:bg-brand-sand/5">
            Terms of Service →
          </Link>
          <Link href="/privacy" className="block rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-3 text-sm text-brand-charcoal dark:text-brand-sand hover:bg-brand-charcoal/5 dark:hover:bg-brand-sand/5">
            Privacy Policy →
          </Link>
        </div>
      </section>

      {/* Data */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-2">Your Data</h2>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-3 text-sm text-brand-charcoal dark:text-brand-sand hover:bg-brand-charcoal/5 dark:hover:bg-brand-sand/5 text-left disabled:opacity-50"
          >
            {isExporting ? "Exporting..." : "Export all data (JSON)"}
          </button>
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="w-full rounded-lg border border-brand-teal/20 bg-brand-teal/5 dark:bg-brand-teal/10 p-3 text-sm text-brand-teal font-medium hover:bg-brand-teal/10 dark:hover:bg-brand-teal/20 text-left disabled:opacity-50 min-h-[44px] flex items-center gap-2"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
            </svg>
            {isResetting ? "Resetting..." : "Reset & Reload All Data"}
          </button>
          <p className="text-[10px] text-brand-charcoal/50 dark:text-brand-sand/50 px-1">
            Clears offline species, parks, and search data then reloads fresh. Your posts and account are not affected.
          </p>
        </div>
      </section>

      {/* Feedback */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-brand-sand mb-2">Feedback</h2>
        <button
          type="button"
          onClick={openFeedback}
          className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 p-3 text-sm text-brand-teal font-medium hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors text-left min-h-[44px] flex items-center gap-2"
          aria-label="Send feedback about ForageWise"
        >
          <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          Send Feedback
        </button>
      </section>

      {/* Danger Zone */}
      <section className="border-t border-red-200 pt-6">
        <h2 className="text-sm font-semibold text-red-700 mb-2">Danger Zone</h2>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full rounded-lg border border-red-200 p-3 text-sm text-red-700 hover:bg-red-50"
          >
            Delete Account
          </button>
        ) : (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="text-xs text-red-800 mb-3">
              This will permanently delete all your data. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={handleDelete} className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700">
                Confirm Delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-md bg-brand-charcoal/10 dark:bg-brand-sand/10 px-3 py-2 text-sm text-brand-charcoal dark:text-brand-sand hover:bg-brand-charcoal/20 dark:hover:bg-brand-sand/20">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
