'use client';

/**
 * ForageWise — DownloadMapButton Component
 *
 * Button + panel for downloading map tiles for offline use.
 * Shows download progress, saved regions, and storage usage.
 */

import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useOfflineMaps, type RegionBounds } from '@/hooks/useOfflineMaps';

// Pre-defined Tennessee regions for easy download
const PRESET_REGIONS: Array<{ name: string; bounds: RegionBounds; description: string }> = [
  {
    name: 'East Tennessee',
    bounds: { north: 36.6, south: 35.0, east: -81.6, west: -84.3 },
    description: 'Great Smoky Mountains, Big Ridge, Frozen Head, Roan Mountain',
  },
  {
    name: 'Middle Tennessee',
    bounds: { north: 36.6, south: 35.2, east: -84.3, west: -87.0 },
    description: 'Fall Creek Falls, Burgess Falls, Edgar Evins, Cedars of Lebanon',
  },
  {
    name: 'West Tennessee',
    bounds: { north: 36.6, south: 35.0, east: -87.0, west: -90.3 },
    description: 'Reelfoot Lake, Big Hill Pond, Chickasaw, Natchez Trace',
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DownloadMapButton() {
  const isOnline = useOnlineStatus();
  const { progress, regions, downloadRegion, loadRegions, deleteRegion } = useOfflineMaps();
  const [panelOpen, setPanelOpen] = useState(false);

  // Load saved regions on mount
  useEffect(() => {
    loadRegions();
  }, [loadRegions]);

  const handleDownload = useCallback(async (preset: typeof PRESET_REGIONS[number]) => {
    try {
      await downloadRegion(preset.name, preset.bounds);
    } catch {
      // Error handled by hook
    }
  }, [downloadRegion]);

  const totalSize = regions.reduce((sum, r) => sum + r.sizeBytes, 0);

  return (
    <>
      {/* Download button */}
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-dark-surface/60 px-3 py-2 text-xs font-medium text-brand-charcoal dark:text-dark-text hover:bg-brand-teal/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
        aria-label="Download map for offline use"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        Download Map
        {regions.length > 0 && (
          <span className="rounded-full bg-brand-teal/15 text-brand-teal text-[10px] font-bold px-1.5 py-0.5">
            {regions.length}
          </span>
        )}
      </button>

      {/* Download panel */}
      {panelOpen && (
        <div
          role="dialog"
          aria-label="Download map for offline"
          className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/30 px-4 pb-20 sm:pb-4"
          onClick={() => setPanelOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white dark:bg-dark-surface border border-brand-teal/20 shadow-xl overflow-hidden max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-dark-surface border-b border-brand-charcoal/10 dark:border-dark-border px-4 py-3 flex items-center justify-between">
              <h2 className="font-heading font-semibold text-base text-brand-forest dark:text-brand-moss">
                Offline Maps
              </h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 hover:bg-brand-charcoal/10 dark:hover:bg-dark-border transition-colors"
              >
                <svg className="w-5 h-5 text-brand-charcoal/60 dark:text-brand-sand/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* How it works */}
              <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 leading-relaxed">
                Download map tiles to use the map without internet. Choose a region below — tiles are stored on your device.
              </p>

              {/* Download progress */}
              {progress.isDownloading && (
                <div className="rounded-lg bg-brand-teal/5 dark:bg-brand-teal/10 border border-brand-teal/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-brand-teal">Downloading…</span>
                    <span className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
                      {progress.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-brand-charcoal/10 dark:bg-dark-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-teal transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-brand-charcoal/50 dark:text-brand-sand/50 mt-1">
                    {progress.tilesDownloaded} / {progress.totalTiles} tiles
                    {progress.estimatedSecondsRemaining > 0 && ` • ~${progress.estimatedSecondsRemaining}s remaining`}
                  </p>
                </div>
              )}

              {/* Preset regions to download */}
              {!progress.isDownloading && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-brand-charcoal/50 dark:text-brand-sand/50 uppercase tracking-wide">
                    Download a Region
                  </h3>
                  {PRESET_REGIONS.map((preset) => {
                    const alreadyDownloaded = regions.some((r) => r.name === preset.name);
                    return (
                      <div
                        key={preset.name}
                        className="flex items-center justify-between rounded-lg border border-brand-charcoal/10 dark:border-dark-border bg-white/60 dark:bg-dark-surface/60 px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-brand-charcoal dark:text-dark-text">
                            {preset.name}
                          </p>
                          <p className="text-[10px] text-brand-charcoal/50 dark:text-brand-sand/50 truncate">
                            {preset.description}
                          </p>
                        </div>
                        {alreadyDownloaded ? (
                          <span className="shrink-0 text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-full px-2 py-0.5">
                            ✓ Saved
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDownload(preset)}
                            disabled={!isOnline}
                            className="shrink-0 rounded-lg bg-brand-teal text-white text-xs font-medium px-3 py-1.5 hover:bg-brand-teal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[32px]"
                          >
                            {isOnline ? 'Download' : 'Need WiFi'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Saved regions */}
              {regions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-brand-charcoal/50 dark:text-brand-sand/50 uppercase tracking-wide">
                      Saved Regions
                    </h3>
                    <span className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40">
                      {formatBytes(totalSize)} used
                    </span>
                  </div>
                  {regions.map((region) => (
                    <div
                      key={region.id}
                      className="flex items-center justify-between rounded-lg border border-brand-charcoal/10 dark:border-dark-border px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-brand-charcoal dark:text-dark-text">
                          {region.name}
                        </p>
                        <p className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40">
                          {region.tileCount} tiles • {formatBytes(region.sizeBytes)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteRegion(region.id)}
                        aria-label={`Delete ${region.name}`}
                        className="shrink-0 rounded p-1.5 text-red-500/60 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tip */}
              <p className="text-[10px] text-brand-charcoal/40 dark:text-brand-sand/40 text-center leading-relaxed">
                💡 Download over WiFi before heading into the field. Maps stay on your device until you delete them.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
