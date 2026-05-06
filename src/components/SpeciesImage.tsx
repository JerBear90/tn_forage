"use client";

/**
 * ForageWise — SpeciesImage Component
 *
 * Mobile-optimized image component for species, plant, and tree photos.
 * Uses Next.js Image for automatic WebP/AVIF conversion, responsive
 * srcSet generation, and lazy loading. Falls back to a placeholder
 * icon when no valid image URL is available.
 *
 * Sizes are tuned for ForageWise's mobile-first layout:
 *   - Card thumbnails: 400px wide (covers up to 2x on ~200px cards)
 *   - Detail gallery:  640px wide (covers up to 2x on ~320px viewport)
 *   - Seasonal cards:  384px wide (covers up to 2x on ~192px cards)
 */

import Image from "next/image";
import { useState } from "react";
import { reportMissingImage } from "@/services/missingImageReporter";

// ---------------------------------------------------------------------------
// Blur placeholder — tiny 4×3 gray data URI for skeleton effect while loading
// ---------------------------------------------------------------------------

/**
 * A minimal 4×3 pixel gray PNG encoded as a base64 data URI.
 * Used as the `blurDataURL` for Next.js Image `placeholder="blur"`,
 * giving a subtle skeleton shimmer while the real image loads.
 */
const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAL0lEQVQImWN4+/bt////GRgYGBgYGP7//8/AwMDAwPD//38GBgYGBob///8zMDAAADqMCgkPvrF4AAAAAElFTkSuQmCC";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if a src looks like a usable image (local path or remote URL) */
function isUsableImage(src: string): boolean {
  return src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://");
}

/** Find the first usable image URL from an images array */
export function pickImageUrl(images: string[]): string | null {
  return images.find(isUsableImage) ?? null;
}

// ---------------------------------------------------------------------------
// Placeholder SVG (used when no image is available or on error)
// ---------------------------------------------------------------------------

function PlaceholderIcon({ className }: { className?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <svg
        aria-hidden="true"
        className={className ?? "w-10 h-10 text-brand-charcoal/20 dark:text-brand-sand/20"}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
        />
      </svg>
      <span className="text-[10px] font-medium text-brand-charcoal/30 dark:text-brand-sand/30">
        Coming soon
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SpeciesImageProps {
  /** Image URL (must be https://) */
  src: string | null;
  /** Alt text for accessibility */
  alt: string;
  /**
   * Rendering variant controls sizing and quality:
   * - "card"     : field guide grid cards (aspect 4:3, 400w)
   * - "detail"   : species detail gallery (w-48 h-36, 640w)
   * - "seasonal" : home page seasonal cards (w-full h-28, 384w)
   * - "result"   : ID result card banner (w-full h-32, 480w)
   */
  variant?: "card" | "detail" | "seasonal" | "result";
  /** Additional CSS classes on the wrapper */
  className?: string;
  /** Click handler (used for lightbox triggers) */
  onClick?: () => void;
}

// ---------------------------------------------------------------------------
// Variant configs
// ---------------------------------------------------------------------------

const VARIANT_CONFIG = {
  card: {
    width: 400,
    height: 300,
    sizes: "(max-width: 640px) 50vw, 300px",
    quality: 70,
  },
  detail: {
    width: 640,
    height: 480,
    sizes: "(max-width: 640px) 90vw, 320px",
    quality: 75,
  },
  seasonal: {
    width: 384,
    height: 224,
    sizes: "176px",
    quality: 65,
  },
  result: {
    width: 480,
    height: 256,
    sizes: "(max-width: 640px) 100vw, 480px",
    quality: 70,
  },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SpeciesImage({
  src,
  alt,
  variant = "card",
  className,
  onClick,
}: SpeciesImageProps) {
  const [errored, setErrored] = useState(false);
  const config = VARIANT_CONFIG[variant];

  const showImage = src && isUsableImage(src) && !errored;

  if (!showImage) {
    return (
      <div
        className={`flex items-center justify-center bg-brand-sand/60 dark:bg-dark-surface/80 ${className ?? ""}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <PlaceholderIcon
          className={
            variant === "seasonal"
              ? "w-8 h-8 text-brand-charcoal/20 dark:text-brand-sand/20"
              : "w-12 h-12 text-brand-charcoal/20 dark:text-brand-sand/20"
          }
        />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-brand-sand/60 dark:bg-dark-surface/80 ${className ?? ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <Image
        src={src}
        alt={alt}
        width={config.width}
        height={config.height}
        sizes={config.sizes}
        quality={config.quality}
        className="w-full h-full object-cover"
        loading="lazy"
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        unoptimized={src.startsWith('/images/')}
        onError={() => {
          setErrored(true);
          reportMissingImage(src, `SpeciesImage variant=${variant}`);
        }}
      />
    </div>
  );
}
