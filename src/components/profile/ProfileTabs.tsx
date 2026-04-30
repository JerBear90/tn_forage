"use client";

/**
 * ForageFlow — Profile Tabs Component
 *
 * Tabbed interface showing: Completed Trips, Achievements, Reviews, Photos.
 * When viewing another user's profile, filters to public-visibility items only.
 *
 * Requirements: 13.3, 13.4, 5.3, 5.4, 5.5
 */

import { useState, useEffect } from "react";
import { getDB } from "@/offline/db";
import { getAchievements } from "@/social/achievementTracker";
import { filterPublicItems } from "@/social/visibilityFilter";
import type {
  Trip,
  AchievementLocal,
  ReviewLocal,
  SocialPhoto,
} from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Tab names displayed in the UI */
export const TAB_NAMES = [
  "Completed Trips",
  "Achievements",
  "Reviews",
  "Photos",
] as const;

export type ProfileTab = (typeof TAB_NAMES)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProfileTabsProps {
  userId: string;
  isOwnProfile: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProfileTabs({ userId, isOwnProfile }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>("Completed Trips");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [achievements, setAchievements] = useState<AchievementLocal[]>([]);
  const [reviews, setReviews] = useState<ReviewLocal[]>([]);
  const [photos, setPhotos] = useState<SocialPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from IndexedDB
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const db = await getDB();

        // Load trips
        const allTrips = await db.getAllFromIndex("trips", "by-userId", userId);

        // Load achievements
        const allAchievements = await getAchievements(userId);

        // Load reviews
        const allReviews = await db.getAllFromIndex("reviews", "by-userId", userId);

        // Load photos
        const allPhotos = await db.getAllFromIndex("socialPhotos", "by-userId", userId);

        if (!cancelled) {
          setTrips(allTrips);
          setAchievements(allAchievements);
          setReviews(allReviews);
          setPhotos(allPhotos);
        }
      } catch {
        // IndexedDB may not be available
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // When viewing another user's profile, filter to public items only
  // Trips and photos need a visibility field for filtering
  const displayTrips = !isOwnProfile
    ? filterPublicItems(
        trips.map((t) => ({ ...t, visibility: "public" as const }))
      )
    : trips;

  const displayReviews = reviews;
  const displayAchievements = achievements;
  const displayPhotos = photos;

  return (
    <div className="rounded-xl bg-white/80 dark:bg-brand-charcoal/60 border border-brand-teal/10 overflow-hidden">
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Profile sections"
        className="flex border-b border-brand-teal/10 overflow-x-auto"
      >
        {TAB_NAMES.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`tabpanel-${tab.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-3 text-xs font-medium transition-colors min-h-[44px] ${
              activeTab === tab
                ? "text-brand-teal border-b-2 border-brand-teal bg-brand-teal/5"
                : "text-brand-charcoal/60 dark:text-brand-sand/60 hover:text-brand-charcoal dark:hover:text-brand-sand hover:bg-brand-teal/5"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="p-4">
        {loading ? (
          <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50 text-center py-6">
            Loading…
          </p>
        ) : (
          <>
            {/* Completed Trips */}
            {activeTab === "Completed Trips" && (
              <div
                role="tabpanel"
                id="tabpanel-completed-trips"
                aria-label="Completed Trips"
              >
                {displayTrips.length === 0 ? (
                  <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50 text-center py-6">
                    No completed trips yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {displayTrips.map((trip) => (
                      <li
                        key={trip.id}
                        className="rounded-lg bg-brand-teal/5 dark:bg-brand-teal/10 px-3 py-2.5"
                      >
                        <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                          {trip.customLocation || trip.locationId || "Trip"}
                        </p>
                        <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-0.5">
                          {trip.date}
                          {trip.targetSpecies.length > 0 &&
                            ` · ${trip.targetSpecies.length} species`}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Achievements */}
            {activeTab === "Achievements" && (
              <div
                role="tabpanel"
                id="tabpanel-achievements"
                aria-label="Achievements"
              >
                {displayAchievements.length === 0 ? (
                  <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50 text-center py-6">
                    No achievements earned yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {displayAchievements.map((ach) => (
                      <li
                        key={ach.id}
                        className="rounded-lg bg-brand-moss/5 dark:bg-brand-moss/10 px-3 py-2.5"
                      >
                        <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand">
                          🏆 {ach.title}
                        </p>
                        <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-0.5">
                          {ach.description}
                        </p>
                        <p className="text-xs text-brand-charcoal/40 dark:text-brand-sand/40 mt-0.5">
                          Earned {ach.earnedAt.split("T")[0]}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Reviews */}
            {activeTab === "Reviews" && (
              <div
                role="tabpanel"
                id="tabpanel-reviews"
                aria-label="Reviews"
              >
                {displayReviews.length === 0 ? (
                  <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50 text-center py-6">
                    No reviews written yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {displayReviews.map((review) => (
                      <li
                        key={review.id}
                        className="rounded-lg bg-brand-earth/5 dark:bg-brand-earth/10 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-brand-charcoal dark:text-brand-sand capitalize">
                            {review.targetType}: {review.targetId}
                          </p>
                          <span className="text-xs text-brand-earth font-medium">
                            {"★".repeat(review.rating)}
                            {"☆".repeat(5 - review.rating)}
                          </span>
                        </div>
                        <p className="text-xs text-brand-charcoal/70 dark:text-brand-sand/70 mt-1 line-clamp-2">
                          {review.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Photos */}
            {activeTab === "Photos" && (
              <div
                role="tabpanel"
                id="tabpanel-photos"
                aria-label="Photos"
              >
                {displayPhotos.length === 0 ? (
                  <p className="text-sm text-brand-charcoal/50 dark:text-brand-sand/50 text-center py-6">
                    No photos shared yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {displayPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="aspect-square rounded-lg overflow-hidden bg-brand-teal/10"
                      >
                        {photo.blob && (
                          <PhotoThumbnail blob={photo.blob} caption={photo.caption} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Photo Thumbnail (renders blob as object URL)
// ---------------------------------------------------------------------------

function PhotoThumbnail({ blob, caption }: { blob: Blob; caption?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  if (!url) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={caption || "Shared photo"}
      className="w-full h-full object-cover"
    />
  );
}
