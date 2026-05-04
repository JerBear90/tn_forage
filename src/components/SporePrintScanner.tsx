"use client";

import { useState, useRef, useCallback } from "react";
import { extractDominantColor, matchSporePrintColor, type SporePrintEntry } from "@/utils/sporePrintMatcher";
import type { SporePrintMatch } from "@/types";

interface SporePrintScannerProps {
  speciesColors: SporePrintEntry[];
  onResults?: (matches: SporePrintMatch[]) => void;
}

/**
 * Spore print scanner using camera capture + Canvas API color extraction + species matching.
 * Requirements: 26.1–26.8
 */
export default function SporePrintScanner({ speciesColors, onResults }: SporePrintScannerProps) {
  const [matches, setMatches] = useState<SporePrintMatch[]>([]);
  const [extractedColor, setExtractedColor] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;

      await new Promise((resolve) => { img.onload = resolve; });

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const dominant = extractDominantColor(imageData);
      const hex = `#${[dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
      setExtractedColor(hex);

      const results = matchSporePrintColor(dominant, speciesColors, 5);
      setMatches(results);
      onResults?.(results);

      URL.revokeObjectURL(url);
    } finally {
      setIsProcessing(false);
    }
  }, [speciesColors, onResults]);

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Spore Print Scanner</h3>

      <p className="text-xs text-gray-600 mb-3">
        Take a photo of your spore print on white paper. The scanner will match the color against known species.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => e.target.files?.[0] && processImage(e.target.files[0])}
        className="hidden"
        aria-label="Capture spore print photo"
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={isProcessing}
        className="w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 mb-3"
      >
        {isProcessing ? "Processing..." : "Scan Spore Print"}
      </button>

      <canvas ref={canvasRef} className="hidden" />

      {extractedColor && (
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded border border-gray-300" style={{ backgroundColor: extractedColor }} />
          <span className="text-sm text-gray-700">Extracted: {extractedColor}</span>
        </div>
      )}

      {matches.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2">Possible Matches</h4>
          <p className="text-[10px] text-amber-700 bg-amber-50 rounded p-1.5 mb-2">
            Spore print color is one identification factor among many. Always verify with multiple features and expert consultation.
          </p>
          <ul className="space-y-2">
            {matches.map((match) => (
              <li key={match.speciesId} className="flex items-center gap-2 rounded border border-gray-100 p-2">
                <div className="h-6 w-6 rounded border" style={{ backgroundColor: match.expectedColor }} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{match.commonName}</p>
                  <p className="text-xs text-gray-500">{match.confidencePercent}% color match</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
