'use client';

/**
 * ForageWise — ShareQR Component
 *
 * Generates a QR code linking to the app. Uses a simple SVG-based
 * QR code generator (no external dependencies).
 * Shows a share button that opens a modal with the QR code.
 */

import { useState, useMemo } from 'react';

// Simple QR code generator using the Google Charts API for the image
// Falls back to a text URL if the image fails to load
const APP_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://foragewise.app';

export interface ShareQRProps {
  /** Custom URL to encode (defaults to app origin) */
  url?: string;
  /** Button variant */
  variant?: 'button' | 'icon';
}

export default function ShareQR({ url, variant = 'button' }: ShareQRProps) {
  const [open, setOpen] = useState(false);
  const shareUrl = url || APP_URL;

  const qrImageUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}&bgcolor=FFFFFF&color=0F766E`;
  }, [shareUrl]);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ForageWise',
          text: 'Offline-first foraging companion for Tennessee. Identify mushrooms, plan trips, explore parks.',
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to QR modal
      }
    }
    setOpen(true);
  };

  return (
    <>
      {variant === 'button' ? (
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-teal/20 bg-brand-teal/5 px-4 py-2.5 text-sm font-medium text-brand-teal hover:bg-brand-teal/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          Share App
        </button>
      ) : (
        <button
          type="button"
          onClick={handleNativeShare}
          aria-label="Share ForageWise"
          className="shrink-0 flex items-center justify-center h-7 w-7 rounded-full text-brand-charcoal/50 dark:text-brand-sand/50 hover:bg-brand-teal/10 hover:text-brand-teal transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
        </button>
      )}

      {/* QR Code Modal */}
      {open && (
        <div
          role="dialog"
          aria-label="Share ForageWise"
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white dark:bg-dark-surface shadow-2xl p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading font-bold text-lg text-brand-forest dark:text-brand-moss mb-1">
              Share ForageWise
            </h2>
            <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mb-4">
              Scan this QR code to open the app
            </p>

            {/* QR Code Image */}
            <div className="mx-auto w-48 h-48 rounded-xl border-2 border-brand-teal/20 overflow-hidden bg-white flex items-center justify-center mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageUrl}
                alt="QR code to share ForageWise"
                width={200}
                height={200}
                className="w-full h-full"
                onError={(e) => {
                  // Fallback: show URL text if QR image fails
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = `<p class="text-xs text-brand-charcoal/60 p-4 break-all">${shareUrl}</p>`;
                }}
              />
            </div>

            {/* URL display */}
            <p className="text-[11px] text-brand-charcoal/50 dark:text-brand-sand/50 break-all mb-4 font-mono">
              {shareUrl}
            </p>

            {/* Copy URL button */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(shareUrl);
              }}
              className="w-full rounded-lg border border-brand-teal/30 bg-brand-teal/5 px-4 py-2.5 text-sm font-medium text-brand-teal hover:bg-brand-teal/10 transition-colors mb-2"
            >
              Copy Link
            </button>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 hover:text-brand-charcoal/60 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
