'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { putRecord, getAllRecords } from '@/offline/db';
import type { SharingSession, SharingRecipient, Coordinates } from '@/types';

const GPS_POLL_INTERVAL_MS = 60 * 1000; // 60 seconds

/**
 * Generates a unique sharing session ID.
 */
function generateSessionId(): string {
  return `share-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generates a shareable link for a session.
 */
function generateShareLink(sessionId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://forageflow.app';
  return `${baseUrl}/share/${sessionId}`;
}

/**
 * Location sharing hook that manages GPS polling, session lifecycle,
 * and share link generation.
 *
 * - GPS polling at 60s intervals while active
 * - Session management with duration and expiration
 * - Share link generation
 *
 * Requirements: 4.1–4.10
 */
export function useLocationSharing(userId: string) {
  const [session, setSession] = useState<SharingSession | null>(null);
  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Starts a new location sharing session.
   */
  const startSharing = useCallback(
    async (durationMinutes: number, recipients: SharingRecipient[]) => {
      // Request geolocation permission
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser.');
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
      const sessionId = generateSessionId();

      const newSession: SharingSession = {
        id: sessionId,
        userId,
        durationMinutes,
        recipients,
        shareLink: generateShareLink(sessionId),
        startedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActive: true,
        syncStatus: 'pending',
      };

      await putRecord('locationSharingSessions', newSession);
      setSession(newSession);
      setIsSharing(true);

      // Start GPS polling
      pollPosition();
      pollTimerRef.current = setInterval(pollPosition, GPS_POLL_INTERVAL_MS);

      return newSession;
    },
    [userId],
  );

  /**
   * Polls the current GPS position.
   */
  const pollPosition = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Silently fail — position will be stale but session continues
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 30000 },
    );
  }, []);

  /**
   * Stops the current sharing session.
   */
  const stopSharing = useCallback(async () => {
    if (session) {
      const updatedSession: SharingSession = {
        ...session,
        isActive: false,
      };
      await putRecord('locationSharingSessions', updatedSession);
      setSession(updatedSession);
    }

    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    setIsSharing(false);
  }, [session]);

  /**
   * Checks if the session has expired and auto-stops if needed.
   */
  useEffect(() => {
    if (!session || !session.isActive) return;

    const checkExpiry = setInterval(() => {
      const now = Date.now();
      const expiresAt = new Date(session.expiresAt).getTime();

      if (now >= expiresAt) {
        stopSharing();
      }
    }, 30 * 1000); // Check every 30 seconds

    return () => clearInterval(checkExpiry);
  }, [session, stopSharing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  /**
   * Gets all sharing sessions for the current user.
   */
  const getSessions = useCallback(async (): Promise<SharingSession[]> => {
    const all = await getAllRecords('locationSharingSessions');
    return all.filter((s: SharingSession) => s.userId === userId);
  }, [userId]);

  return {
    session,
    currentPosition,
    isSharing,
    startSharing,
    stopSharing,
    getSessions,
  };
}
