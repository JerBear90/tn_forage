"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/auth/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { putRecord, getRecord } from "@/offline/db";
import { getFollowerCount, getFollowingCount } from "@/social/followService";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import FindsTimeline from "@/components/profile/FindsTimeline";
import LifeList from "@/components/LifeList";
import type { UserProfileLocal, UserProfileExtended } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Readable role label */
function roleLabel(role: string): string {
  switch (role) {
    case "super_user":
      return "Super User";
    case "member":
      return "Member";
    case "free":
      return "Free";
    case "guest":
      return "Guest";
    default:
      return role;
  }
}

/** Readable membership status */
function membershipLabel(plan: string, status: string): string {
  if (plan === "free") return "Free plan";
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const statusName = status.charAt(0).toUpperCase() + status.slice(1);
  return `${planName} — ${statusName}`;
}

// ---------------------------------------------------------------------------
// Quick-link sections
// ---------------------------------------------------------------------------

const profileSections = [
  {
    label: "My Trips",
    href: "/trips",
    description: "View and manage saved trips",
    icon: "\u{1F5FA}\uFE0F",
  },
  {
    label: "Expedition Logs",
    href: "/expedition",
    description: "Browse your field observations",
    icon: "\u{1F4F7}",
  },
  {
    label: "Field Guide",
    href: "/field-guide",
    description: "Species reference library",
    icon: "\u{1F4D6}",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProfileContent() {
  const { user, role, membership, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isOnline = useOnlineStatus();
  const isDark = theme === "dark";

  // --- Local profile state (from IndexedDB cache) ---
  const [cachedProfile, setCachedProfile] = useState<UserProfileLocal | null>(
    null,
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // --- Edit name ---
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  // --- Avatar upload ---
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);

  // --- Account delete ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRequested, setDeleteRequested] = useState(false);

  // --- Social profile ---
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // The effective profile: auth user first, then cached
  const profile = user ?? cachedProfile;
  const displayName = profile?.displayName || "Not signed in";
  const email = profile?.email || "";

  // Load cached profile from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    async function loadCachedProfile() {
      try {
        // Try to load the user profile from IndexedDB
        const userId = user?.id;
        if (userId) {
          const cached = await getRecord("userProfileLocal", userId);
          if (!cancelled && cached) {
            setCachedProfile(cached);
          }
        } else {
          // Try loading any profile (for offline display)
          const { getAllRecords } = await import("@/offline/db");
          const profiles = await getAllRecords("userProfileLocal");
          if (!cancelled && profiles.length > 0) {
            setCachedProfile(profiles[0] as UserProfileLocal);
          }
        }

        // Load avatar blob from photos store (keyed as "avatar-{userId}")
        const effectiveId = userId || cachedProfile?.id;
        if (effectiveId) {
          const avatarRecord = await getRecord(
            "photos",
            `avatar-${effectiveId}`,
          );
          if (!cancelled && avatarRecord && avatarRecord.blob) {
            const url = URL.createObjectURL(avatarRecord.blob);
            setAvatarUrl(url);
          }
        }
      } catch {
        // IndexedDB may not be available
      }
    }
    loadCachedProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Clean up avatar object URL on unmount
  useEffect(() => {
    return () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load follower/following counts for social profile
  useEffect(() => {
    let cancelled = false;
    async function loadSocialCounts() {
      try {
        const effectiveId = user?.id || cachedProfile?.id || "local-user";
        const [followers, following] = await Promise.all([
          getFollowerCount(effectiveId),
          getFollowingCount(effectiveId),
        ]);
        if (!cancelled) {
          setFollowerCount(followers);
          setFollowingCount(following);
        }
      } catch {
        // IndexedDB may not be available
      }
    }
    loadSocialCounts();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, cachedProfile?.id]);

  // --- Name editing handlers ---
  const startEditName = useCallback(() => {
    setNameInput(profile?.displayName || "");
    setEditingName(true);
    setNameSaved(false);
  }, [profile?.displayName]);

  const cancelEditName = useCallback(() => {
    setEditingName(false);
    setNameInput("");
  }, []);

  const saveName = useCallback(async () => {
    if (!nameInput.trim()) return;
    setNameSaving(true);
    try {
      const effectiveId = profile?.id || "local-user";
      const now = new Date().toISOString();
      const updatedProfile: UserProfileLocal = {
        id: effectiveId,
        email: profile?.email || "",
        displayName: nameInput.trim(),
        avatar: profile?.avatar,
        role: profile?.role || "guest",
        createdAt: profile?.createdAt || now,
        updatedAt: now,
      };
      await putRecord("userProfileLocal", updatedProfile);
      setCachedProfile(updatedProfile);
      setEditingName(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
    } catch {
      // silently fail — offline-first
    } finally {
      setNameSaving(false);
    }
  }, [nameInput, profile]);

  // --- Avatar handlers ---
  const handleAvatarFile = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      setAvatarSaving(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type });
        const effectiveId = profile?.id || "local-user";

        // Save avatar as a photo record in IndexedDB
        await putRecord("photos", {
          id: `avatar-${effectiveId}`,
          blob,
          mimeType: file.type || "image/jpeg",
          caption: "Profile avatar",
          createdAt: new Date().toISOString(),
          syncStatus: "pending",
        });

        // Update avatar URL
        if (avatarUrl) URL.revokeObjectURL(avatarUrl);
        const newUrl = URL.createObjectURL(blob);
        setAvatarUrl(newUrl);
      } catch {
        // silently fail
      } finally {
        setAvatarSaving(false);
      }
    },
    [profile?.id, avatarUrl],
  );

  // --- Account delete request ---
  const handleDeleteRequest = useCallback(async () => {
    try {
      const effectiveId = profile?.id || "local-user";
      // Save a delete request to the settings store
      await putRecord("settings", {
        id: `delete-request-${effectiveId}`,
        theme: "light",
        safetyDisclaimerDismissed: false,
        introAnimationShown: false,
        lastSyncAt: new Date().toISOString(),
      });
      setDeleteRequested(true);
      setShowDeleteConfirm(false);
    } catch {
      // silently fail
    }
  }, [profile?.id]);

  return (
    <main className="flex min-h-screen flex-col px-4 py-6 max-w-lg mx-auto pb-28">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-moss font-heading">
            Profile
          </h1>
          {/* Offline indicator */}
          {!isOnline && (
            <span
              aria-label="You are offline"
              className="inline-flex items-center gap-1 rounded-full bg-brand-earth/15 dark:bg-brand-earth/25 px-2.5 py-0.5 text-xs font-medium text-brand-earth dark:text-amber-300 border border-brand-earth/30 dark:border-amber-400/30"
            >
              <svg
                aria-hidden="true"
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3l18 18"
                />
              </svg>
              Offline
            </span>
          )}
        </div>
        <p className="text-sm text-brand-charcoal/70 dark:text-brand-sand/70 mt-1">
          Your account, settings, and activity.
        </p>
      </header>

      {/* Name saved confirmation */}
      {nameSaved && (
        <div
          role="status"
          className="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-700 dark:text-green-300"
        >
          Display name updated.
        </div>
      )}

      {/* Delete request confirmation */}
      {deleteRequested && (
        <div
          role="status"
          className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300"
        >
          Account deletion requested. This will be processed when you are
          online.
        </div>
      )}

      {/* ── Avatar + Profile Info ── */}
      <section
        aria-label="Profile info"
        className="rounded-xl bg-white/80 dark:bg-brand-charcoal/60 border border-brand-teal/10 p-5 mb-6"
      >
        <div className="flex items-start gap-4">
          {/* Avatar with upload */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-teal/20 bg-brand-teal/10 flex items-center justify-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={`${displayName}'s avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  aria-hidden="true"
                  className="w-10 h-10 text-brand-teal/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              )}
            </div>
            {avatarSaving && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                <span className="text-white text-xs">Saving…</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Display name */}
            {!editingName ? (
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold text-brand-charcoal dark:text-brand-sand truncate">
                  {displayName}
                </p>
                {isAuthenticated && (
                  <button
                    type="button"
                    onClick={startEditName}
                    aria-label="Edit display name"
                    className="flex-shrink-0 rounded p-1 text-brand-teal hover:bg-brand-teal/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
                  >
                    <svg
                      aria-hidden="true"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label htmlFor="edit-display-name" className="sr-only">
                  Display name
                </label>
                <input
                  id="edit-display-name"
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") cancelEditName();
                  }}
                  autoFocus
                  className="flex-1 min-w-0 rounded border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/30 px-2 py-1 text-sm text-brand-charcoal dark:text-brand-sand focus:outline-none focus:ring-1 focus:ring-brand-teal/40"
                />
                <button
                  type="button"
                  onClick={saveName}
                  disabled={nameSaving || !nameInput.trim()}
                  aria-label="Save name"
                  className="flex-shrink-0 rounded p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors disabled:opacity-50"
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={cancelEditName}
                  aria-label="Cancel editing"
                  className="flex-shrink-0 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 transition-colors"
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Email */}
            {email && (
              <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60 mt-0.5 truncate">
                {email}
              </p>
            )}

            {/* Role + membership */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs font-medium text-brand-teal bg-brand-teal/10 rounded-full px-2 py-0.5">
                {roleLabel(role)}
              </span>
              <span className="text-xs text-brand-charcoal/50 dark:text-brand-sand/50">
                {membershipLabel(membership.plan, membership.status)}
              </span>
            </div>

            {/* Not signed in prompt */}
            {!isAuthenticated && (
              <Link
                href="/login"
                className="inline-block mt-2 text-sm font-medium text-brand-teal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
              >
                Sign in →
              </Link>
            )}
          </div>
        </div>

        {/* Avatar upload buttons */}
        <div className="mt-4">
          <p className="text-xs font-medium text-brand-charcoal/70 dark:text-brand-sand/70 mb-2">
            Update avatar
          </p>

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            aria-label="Take photo for avatar"
            onChange={(e) => {
              handleAvatarFile(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-label="Upload avatar from gallery"
            onChange={(e) => {
              handleAvatarFile(e.target.files);
              e.target.value = "";
            }}
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-teal/30 bg-brand-teal/5 py-2.5 text-brand-teal hover:bg-brand-teal/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px] text-xs font-medium"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
              Camera
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand-moss/30 bg-brand-moss/5 py-2.5 text-brand-moss hover:bg-brand-moss/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px] text-xs font-medium"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
              Gallery
            </button>
          </div>
        </div>
      </section>

      {/* ── Social Profile Header ── */}
      <section className="mb-6">
        <ProfileHeader
          profile={
            {
              ...(profile || {
                id: "local-user",
                email: "",
                displayName: "Not signed in",
                role: "guest" as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }),
              bio: "",
              followerCount,
              followingCount,
              completedTripCount: 0,
              achievementCount: 0,
              defaultVisibility: "private",
            } as UserProfileExtended
          }
          isOwnProfile={true}
        />
      </section>

      {/* ── Life List Stats ── */}
      <section className="mb-6 rounded-xl bg-white/80 dark:bg-brand-charcoal/60 border border-brand-teal/10 p-4">
        <LifeList userId={profile?.id || "local-user"} />
      </section>

      {/* ── Profile Tabs ── */}
      <section className="mb-6">
        <ProfileTabs
          userId={profile?.id || "local-user"}
          isOwnProfile={true}
        />
      </section>

      {/* ── My Finds Timeline ── */}
      <section className="mb-6">
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-3">
          My Finds
        </h2>
        <FindsTimeline userId={profile?.id || "local-user"} />
      </section>

      {/* ── Quick Links ── */}
      <section aria-label="Quick links" className="space-y-2 mb-8">
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-2">
          Activity
        </h2>
        {profileSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="flex items-center gap-3 rounded-lg bg-white/60 dark:bg-brand-charcoal/40 border border-brand-forest/10 px-4 py-3 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
          >
            <span className="text-lg" aria-hidden="true">
              {section.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-brand-charcoal dark:text-brand-sand">
                {section.label}
              </p>
              <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
                {section.description}
              </p>
            </div>
            <svg
              aria-hidden="true"
              className="w-4 h-4 text-brand-charcoal/30 dark:text-brand-sand/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </Link>
        ))}
      </section>

      {/* ── Admin Dashboard Link (super_user only) ── */}
      {role === 'super_user' && (
        <section aria-label="Admin tools" className="mb-8">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 rounded-lg bg-brand-teal/10 dark:bg-brand-teal/20 border border-brand-teal/30 px-4 py-3 hover:bg-brand-teal/15 dark:hover:bg-brand-teal/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
          >
            <span className="text-lg" aria-hidden="true">📈</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-brand-teal">
                Admin Dashboard
              </p>
              <p className="text-xs text-brand-teal/70">
                Analytics, users, notifications, content management
              </p>
            </div>
            <svg
              aria-hidden="true"
              className="w-4 h-4 text-brand-teal/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </Link>
        </section>
      )}

      {/* ── Support ── */}
      <section aria-label="Support" className="mb-8">
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand mb-2">
          Support
        </h2>
        <Link
          href="/support"
          className="flex items-center gap-3 rounded-lg bg-white/60 dark:bg-brand-charcoal/40 border border-brand-forest/10 px-4 py-3 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors"
        >
          <span className="text-lg" aria-hidden="true">🛟</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-brand-charcoal dark:text-brand-sand">
              Get Help
            </p>
            <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
              Report a problem or request assistance
            </p>
          </div>
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-brand-charcoal/30 dark:text-brand-sand/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </Link>
      </section>

      {/* ── Settings ── */}
      <section aria-label="Settings" className="space-y-3 mb-8">
        <h2 className="font-heading font-semibold text-base text-brand-charcoal dark:text-brand-sand">
          Settings
        </h2>

        {/* Dark mode toggle */}
        <div className="flex items-center justify-between rounded-lg bg-white/60 dark:bg-brand-charcoal/40 border border-brand-forest/10 px-4 py-3">
          <div>
            <p className="font-semibold text-sm text-brand-charcoal dark:text-brand-sand">
              Dark Mode
            </p>
            <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
              Toggle light and dark themes
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            onClick={toggleTheme}
            className={`relative w-11 h-6 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal ${
              isDark ? "bg-brand-teal" : "bg-brand-charcoal/20"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isDark ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Membership display */}
        <div className="flex items-center justify-between rounded-lg bg-white/60 dark:bg-brand-charcoal/40 border border-brand-forest/10 px-4 py-3">
          <div>
            <p className="font-semibold text-sm text-brand-charcoal dark:text-brand-sand">
              Membership
            </p>
            <p className="text-xs text-brand-charcoal/60 dark:text-brand-sand/60">
              {membershipLabel(membership.plan, membership.status)}
            </p>
          </div>
          <span className="text-xs font-medium text-brand-teal bg-brand-teal/10 rounded-full px-2 py-0.5">
            {membership.plan === "free"
              ? "Free"
              : membership.plan.charAt(0).toUpperCase() +
                membership.plan.slice(1)}
          </span>
        </div>

        {/* Account delete request */}
        {isAuthenticated && (
          <div className="rounded-lg bg-white/60 dark:bg-brand-charcoal/40 border border-brand-forest/10 px-4 py-3">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
              >
                Request account deletion
              </button>
            ) : (
              <div>
                <p className="text-sm text-brand-charcoal dark:text-brand-sand mb-3">
                  Are you sure? This will submit a deletion request. Your
                  account will be removed once processed by the server.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDeleteRequest}
                    className="flex-1 rounded-lg bg-red-600 text-white text-sm font-semibold py-2.5 hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors min-h-[44px]"
                  >
                    Yes, delete my account
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 text-sm font-medium text-brand-charcoal dark:text-brand-sand py-2.5 hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sign out */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => logout()}
            className="w-full rounded-lg border border-brand-teal/20 bg-white/60 dark:bg-brand-charcoal/40 px-4 py-3 text-sm font-medium text-brand-charcoal dark:text-brand-sand hover:bg-brand-teal/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal transition-colors min-h-[44px]"
          >
            Sign out
          </button>
        )}
      </section>

      {/* Offline cache note */}
      <p className="text-xs text-center text-brand-charcoal/50 dark:text-brand-sand/50">
        Profile data is cached locally for offline access.
        {!isOnline && " You are currently viewing cached data."}
      </p>
    </main>
  );
}