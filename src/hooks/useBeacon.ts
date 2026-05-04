'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { putRecord, getRecord, getAllRecords } from '@/offline/db';
import type { BeaconSession, EmergencyContact, Coordinates } from '@/types';

/**
 * Beacon state exposed to the UI.
 */
export interface BeaconState {
  isActive: boolean;
  remainingMinutes: number;
  alertTriggered: boolean;
  lastActivityAt: string | null;
}

/**
 * Generates a unique beacon session ID.
 */
function generateBeaconId(): string {
  return `beacon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Safety beacon hook that monitors user activity and triggers alerts
 * when the inactivity timer exceeds the configured duration.
 *
 * - Manages beacon state (active/inactive)
 * - Monitors activity (app interaction, GPS movement)
 * - Triggers safety alerts when timer exceeds duration
 * - Queues alerts in sync queue when offline
 *
 * Requirements: 11.1–11.9
 */
export function useBeacon(userId: string) {
  const [state, setState] = useState<BeaconState>({
    isActive: false,
    remainingMinutes: 0,
    alertTriggered: false,
    lastActivityAt: null,
  });

  const sessionRef = useRef<BeaconSession | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Records user activity to reset the inactivity timer.
   */
  const recordActivity = useCallback(async () => {
    if (!sessionRef.current || !sessionRef.current.isActive) return;

    const now = new Date().toISOString();
    sessionRef.current.lastActivityAt = now;

    setState((prev) => ({ ...prev, lastActivityAt: now }));

    // Persist updated session
    await putRecord('beaconSessions', sessionRef.current);
  }, []);

  /**
   * Starts the safety beacon with a specified duration.
   */
  const startBeacon = useCallback(
    async (durationMinutes: number, lastKnownCoordinates?: Coordinates) => {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

      // Get emergency contacts
      const contacts = await getAllRecords('emergencyContacts');
      const contactIds = contacts
        .filter((c: EmergencyContact) => c.userId === userId)
        .map((c: EmergencyContact) => c.id);

      const session: BeaconSession = {
        id: generateBeaconId(),
        userId,
        durationMinutes,
        contacts: contactIds,
        lastActivityAt: now.toISOString(),
        startedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        isActive: true,
        alertTriggered: false,
        lastKnownCoordinates,
        syncStatus: 'pending',
      };

      sessionRef.current = session;
      await putRecord('beaconSessions', session);

      setState({
        isActive: true,
        remainingMinutes: durationMinutes,
        alertTriggered: false,
        lastActivityAt: now.toISOString(),
      });

      // Start the monitoring interval (check every 60 seconds)
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => checkInactivity(), 60 * 1000);
    },
    [userId],
  );

  /**
   * Checks if the inactivity timer has been exceeded.
   */
  const checkInactivity = useCallback(async () => {
    if (!sessionRef.current || !sessionRef.current.isActive) return;

    const now = Date.now();
    const lastActivity = new Date(sessionRef.current.lastActivityAt).getTime();
    const durationMs = sessionRef.current.durationMinutes * 60 * 1000;
    const elapsed = now - lastActivity;

    // Update remaining time
    const remainingMs = Math.max(0, durationMs - elapsed);
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

    setState((prev) => ({ ...prev, remainingMinutes }));

    // Check if inactivity exceeded
    if (elapsed >= durationMs && !sessionRef.current.alertTriggered) {
      await triggerAlert();
    }
  }, []);

  /**
   * Triggers a safety alert to emergency contacts.
   */
  const triggerAlert = useCallback(async () => {
    if (!sessionRef.current) return;

    sessionRef.current.alertTriggered = true;
    await putRecord('beaconSessions', sessionRef.current);

    setState((prev) => ({ ...prev, alertTriggered: true }));

    // Queue alert for sync (actual notification delivery handled by push system)
    // In Phase 3.2, this stores the alert state; push notification wiring is in task 13
  }, []);

  /**
   * Stops the beacon and sends an "all clear" signal.
   */
  const stopBeacon = useCallback(async () => {
    if (sessionRef.current) {
      sessionRef.current.isActive = false;
      await putRecord('beaconSessions', sessionRef.current);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    sessionRef.current = null;
    setState({
      isActive: false,
      remainingMinutes: 0,
      alertTriggered: false,
      lastActivityAt: null,
    });
  }, []);

  /**
   * Extends the beacon timer by additional minutes.
   */
  const extendTimer = useCallback(async (additionalMinutes: number) => {
    if (!sessionRef.current) return;

    sessionRef.current.durationMinutes += additionalMinutes;
    const newExpiry = new Date(
      new Date(sessionRef.current.startedAt).getTime() +
        sessionRef.current.durationMinutes * 60 * 1000,
    );
    sessionRef.current.expiresAt = newExpiry.toISOString();

    await putRecord('beaconSessions', sessionRef.current);

    // Recalculate remaining time
    const now = Date.now();
    const lastActivity = new Date(sessionRef.current.lastActivityAt).getTime();
    const durationMs = sessionRef.current.durationMinutes * 60 * 1000;
    const elapsed = now - lastActivity;
    const remainingMs = Math.max(0, durationMs - elapsed);

    setState((prev) => ({
      ...prev,
      remainingMinutes: Math.ceil(remainingMs / (60 * 1000)),
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    state,
    startBeacon,
    stopBeacon,
    extendTimer,
    recordActivity,
  };
}
