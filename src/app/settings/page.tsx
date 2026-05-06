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
      <h1 className="text-xl font-bold text-gray-800 mb-6">Settings</h1>

      {/* Analytics */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Privacy</h2>
        <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
          <span className="text-sm text-gray-700">Opt out of usage analytics</span>
          <input
            type="checkbox"
            checked={analyticsOptOut}
            onChange={(e) => setAnalyticsOptOut(e.target.checked)}
            className="rounded border-gray-300"
          />
        </label>
      </section>

      {/* Notifications */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Notifications</h2>
        <div className="space-y-2">
          <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
            <span className="text-sm text-gray-700">Push notifications</span>
            <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} className="rounded border-gray-300" />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
            <span className="text-sm text-gray-700">New blog article alerts</span>
            <input type="checkbox" checked={blogNotifications} onChange={(e) => setBlogNotifications(e.target.checked)} className="rounded border-gray-300" />
          </label>
        </div>
      </section>

      {/* Legal */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Legal</h2>
        <div className="space-y-2">
          <Link href="/terms" className="block rounded-lg border border-gray-200 p-3 text-sm text-gray-700 hover:bg-gray-50">
            Terms of Service →
          </Link>
          <Link href="/privacy" className="block rounded-lg border border-gray-200 p-3 text-sm text-gray-700 hover:bg-gray-50">
            Privacy Policy →
          </Link>
        </div>
      </section>

      {/* Data */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Your Data</h2>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-700 hover:bg-gray-50 text-left disabled:opacity-50"
        >
          {isExporting ? "Exporting..." : "Export all data (JSON)"}
        </button>
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
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-md bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
