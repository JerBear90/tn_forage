'use client';

import { useState, useCallback, useEffect } from 'react';
import { getAllRecords } from '@/offline/db';
import type { EventEntry, EventType } from '@/types';

/**
 * Date range filter options.
 */
export type DateRangeFilter = 'this-week' | 'this-month' | 'upcoming' | 'all';

/**
 * Events hook that fetches and caches event data with filtering
 * by type and date range.
 *
 * Requirements: 13.1–13.7
 */
export function useEvents() {
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>('upcoming');

  /**
   * Loads all events from IndexedDB.
   */
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await getAllRecords('eventEntries');
      const sorted = (all as EventEntry[]).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      setEvents(sorted);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Applies type and date range filters to the events list.
   */
  const applyFilters = useCallback(() => {
    let filtered = [...events];
    const now = new Date();

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((e) => e.type === typeFilter);
    }

    // Apply date range filter
    switch (dateFilter) {
      case 'this-week': {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        filtered = filtered.filter((e) => {
          const eventDate = new Date(e.date);
          return eventDate >= now && eventDate <= weekEnd;
        });
        break;
      }
      case 'this-month': {
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        filtered = filtered.filter((e) => {
          const eventDate = new Date(e.date);
          return eventDate >= now && eventDate <= monthEnd;
        });
        break;
      }
      case 'upcoming': {
        filtered = filtered.filter((e) => new Date(e.date) >= now);
        break;
      }
      case 'all':
      default:
        break;
    }

    setFilteredEvents(filtered);
  }, [events, typeFilter, dateFilter]);

  // Apply filters whenever events or filter settings change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events: filteredEvents,
    allEvents: events,
    isLoading,
    typeFilter,
    dateFilter,
    setTypeFilter,
    setDateFilter,
    loadEvents,
  };
}
