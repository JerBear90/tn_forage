"use client";

import type { ForagingProfile } from "@/types";

interface BuddyMatchingPanelProps {
  profile: ForagingProfile | null;
  matches: ForagingProfile[];
  onSendInvitation: (toUserId: string) => void;
}

/**
 * Foraging buddy matching panel showing profile and potential matches.
 * Requirements: 30.1–30.9
 */
export default function BuddyMatchingPanel({ profile, matches, onSendInvitation }: BuddyMatchingPanelProps) {
  if (!profile || !profile.optedIn) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-600 mb-2">Create a foraging profile to find buddies.</p>
        <p className="text-xs text-gray-500">Set your experience level, interests, and preferred regions.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Foraging Buddies</h3>

      {matches.length === 0 ? (
        <p className="text-xs text-gray-500">No matches found yet. Check back later.</p>
      ) : (
        <ul className="space-y-3">
          {matches.map((match) => (
            <li key={match.id} className="flex items-center gap-3 rounded-md border border-gray-100 p-3">
              <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                {match.experienceLevel[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 capitalize">{match.experienceLevel}</p>
                <p className="text-xs text-gray-500">
                  {match.interests.join(", ")} · {match.preferredRegions.join(", ")}
                </p>
                <p className="text-xs text-gray-400">{match.availability.join(", ")}</p>
              </div>
              <button
                onClick={() => onSendInvitation(match.userId)}
                className="rounded-md bg-teal-600 px-2 py-1 text-xs text-white hover:bg-teal-700"
              >
                Invite
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
