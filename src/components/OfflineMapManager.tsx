"use client";

import type { DownloadedMapRegion } from "@/types";

interface OfflineMapManagerProps {
  regions: DownloadedMapRegion[];
  isDownloading: boolean;
  percentage: number;
  estimatedSecondsRemaining: number;
  onDownload: (name: string) => void;
  onDelete: (regionId: string) => void;
}

/**
 * Offline map region selection, download progress, and management UI.
 * Requirements: 7.1–7.8
 */
export default function OfflineMapManager({
  regions,
  isDownloading,
  percentage,
  estimatedSecondsRemaining,
  onDownload,
  onDelete,
}: OfflineMapManagerProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Offline Maps</h3>

      {isDownloading && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Downloading...</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
            <div className="bg-teal-600 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            ~{Math.ceil(estimatedSecondsRemaining / 60)} min remaining
          </p>
        </div>
      )}

      {!isDownloading && (
        <button
          onClick={() => onDownload("Current Area")}
          className="w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 mb-4"
        >
          Download This Area
        </button>
      )}

      {regions.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Downloaded Regions</h4>
          <ul className="space-y-2">
            {regions.map((region) => (
              <li key={region.id} className="flex items-center justify-between rounded border border-gray-100 p-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">{region.name}</p>
                  <p className="text-xs text-gray-500">
                    {region.tileCount} tiles · {(region.sizeBytes / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
                <button
                  onClick={() => onDelete(region.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                  aria-label={`Delete ${region.name}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {regions.length === 0 && !isDownloading && (
        <p className="text-xs text-gray-500">No offline maps downloaded yet.</p>
      )}
    </div>
  );
}
