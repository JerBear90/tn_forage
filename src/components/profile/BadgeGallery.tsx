"use client";

import type { ChallengeBadge } from "@/types";

interface BadgeGalleryProps {
  badges: ChallengeBadge[];
  onBadgeClick?: (badge: ChallengeBadge) => void;
}

/**
 * Grid display of earned and locked challenge badges on user profile.
 * Requirements: 8.4, 8.5, 8.6
 */
export default function BadgeGallery({ badges, onBadgeClick }: BadgeGalleryProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Badges</h3>
      <div className="grid grid-cols-4 gap-3" role="list" aria-label="Badge gallery">
        {badges.map((badge) => (
          <button
            key={badge.id}
            onClick={() => onBadgeClick?.(badge)}
            className={`flex flex-col items-center rounded-lg p-2 transition-opacity ${
              badge.isEarned ? "opacity-100" : "opacity-40 grayscale"
            }`}
            aria-label={`${badge.title}${badge.isEarned ? " — earned" : " — locked"}`}
            role="listitem"
          >
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl mb-1">
              {badge.icon || "🏆"}
            </div>
            <span className="text-xs text-center text-gray-700 line-clamp-2">{badge.title}</span>
            {badge.isEarned && badge.earnedAt && (
              <span className="text-[10px] text-teal-600 mt-0.5">
                {new Date(badge.earnedAt).toLocaleDateString()}
              </span>
            )}
          </button>
        ))}
      </div>
      {badges.length === 0 && (
        <p className="text-xs text-gray-500">Complete challenges to earn badges.</p>
      )}
    </div>
  );
}
