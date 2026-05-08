"use client";

import { useState } from "react";
import type { SharingSession, SharingRecipient } from "@/types";

interface LocationSharingPanelProps {
  userId: string;
  session: SharingSession | null;
  isSharing: boolean;
  onStartSharing: (durationMinutes: number, recipients: SharingRecipient[]) => void;
  onStopSharing: () => void;
}

const DURATION_OPTIONS = [
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4 hours", value: 240 },
];

/**
 * Location sharing controls with duration picker and recipient list.
 *
 * Requirements: 4.1–4.10
 */
export default function LocationSharingPanel({
  session,
  isSharing,
  onStartSharing,
  onStopSharing,
}: LocationSharingPanelProps) {
  const [duration, setDuration] = useState(120);
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [recipients, setRecipients] = useState<SharingRecipient[]>([]);

  const addRecipient = () => {
    if (!recipientName.trim() || !recipientContact.trim()) return;
    setRecipients([
      ...recipients,
      {
        id: `r-${Date.now()}`,
        name: recipientName.trim(),
        identifier: recipientContact.trim(),
      },
    ]);
    setRecipientName("");
    setRecipientContact("");
  };

  const handleStart = () => {
    onStartSharing(duration, recipients);
  };

  if (isSharing && session) {
    const remaining = Math.max(
      0,
      Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / 60000),
    );

    return (
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-blue-800">Sharing Location</h3>
          <span className="text-xs text-blue-600">{remaining} min remaining</span>
        </div>
        <p className="text-xs text-blue-700 mb-2">
          Sharing with {session.recipients.length} recipient(s)
        </p>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="text"
            value={session.shareLink}
            readOnly
            className="flex-1 rounded border border-blue-200 bg-white px-2 py-1 text-xs"
            aria-label="Share link"
          />
          <button
            onClick={() => navigator.clipboard?.writeText(session.shareLink)}
            className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
          >
            Copy
          </button>
        </div>
        <button
          onClick={onStopSharing}
          className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Stop Sharing
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-brand-charcoal/10 dark:border-brand-sand/10 p-4">
      <h3 className="text-sm font-semibold text-brand-charcoal dark:text-brand-sand mb-3">Share Your Location</h3>

      <label className="block text-xs text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">Duration</label>
      <select
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        className="w-full rounded border border-brand-charcoal/10 dark:border-brand-sand/10 px-2 py-1.5 text-sm mb-3"
        aria-label="Sharing duration"
      >
        {DURATION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <label className="block text-xs text-brand-charcoal/70 dark:text-brand-sand/70 mb-1">Add Recipient</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Name"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          className="flex-1 rounded border border-brand-charcoal/10 dark:border-brand-sand/10 px-2 py-1.5 text-sm"
          aria-label="Recipient name"
        />
        <input
          type="text"
          placeholder="Email or phone"
          value={recipientContact}
          onChange={(e) => setRecipientContact(e.target.value)}
          className="flex-1 rounded border border-brand-charcoal/10 dark:border-brand-sand/10 px-2 py-1.5 text-sm"
          aria-label="Recipient contact"
        />
        <button onClick={addRecipient} className="rounded bg-brand-charcoal/10 dark:bg-brand-sand/10 px-2 text-sm hover:bg-brand-charcoal/20 dark:hover:bg-brand-sand/20">+</button>
      </div>

      {recipients.length > 0 && (
        <ul className="mb-3 space-y-1">
          {recipients.map((r) => (
            <li key={r.id} className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70">{r.name} ({r.identifier})</li>
          ))}
        </ul>
      )}

      <button
        onClick={handleStart}
        disabled={recipients.length === 0}
        className="w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Start Sharing
      </button>
    </div>
  );
}
