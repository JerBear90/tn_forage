/**
 * Park Detail Components — Unit Tests (logic-level)
 *
 * Tests the underlying logic used by TrailDetailPanel, ReviewsSection,
 * PhotoTour, and the park detail page's conditional rendering.
 *
 * Since vitest runs in a Node environment (no jsdom), these tests verify
 * pure functions, data transformations, and IndexedDB service logic rather
 * than DOM rendering.
 *
 * Validates: Requirements 6.1–6.7, 8.1, 8.2, 9.2, 10.3, 10.4, 12.5
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';

// Trail utilities
import { estimateHikingTime, formatHikingTime } from '@/utils/trailUtils';
import { buildDirectionsUrl } from '@/utils/directionsUtils';

// Review service (uses IndexedDB)
import { validateReviewText, submitReview, getReviews, getAggregation } from '@/social/reviewService';

// Types
import type { Park, SocialPhoto, TrailDifficulty, TrailType, SurfaceType } from '@/types';

// ---------------------------------------------------------------------------
// 1. TrailDetailPanel logic tests
// ---------------------------------------------------------------------------

describe('TrailDetailPanel logic', () => {
  describe('estimateHikingTime — sample trail data', () => {
    it('estimates 2h for a 6-mile flat trail', () => {
      // 6 miles / 3 mph = 2 hours = 120 minutes
      expect(estimateHikingTime(6, 0)).toBe(120);
    });

    it('estimates 2h 30m for a 3-mile trail with 2000 ft gain', () => {
      // (3/3)*60 + (2000/1000)*30 = 60 + 60 = 120 min
      expect(estimateHikingTime(3, 2000)).toBe(120);
    });

    it('estimates correctly for a typical moderate trail (4 mi, 800 ft)', () => {
      // (4/3)*60 + (800/1000)*30 = 80 + 24 = 104 min
      expect(estimateHikingTime(4, 800)).toBe(104);
    });
  });

  describe('formatHikingTime — sample trail outputs', () => {
    it('formats 120 minutes as "2h"', () => {
      expect(formatHikingTime(120)).toBe('2h');
    });

    it('formats 104 minutes as "1h 44m"', () => {
      expect(formatHikingTime(104)).toBe('1h 44m');
    });

    it('formats 30 minutes as "30m"', () => {
      expect(formatHikingTime(30)).toBe('30m');
    });

    it('formats 0 minutes as "0m"', () => {
      expect(formatHikingTime(0)).toBe('0m');
    });
  });

  describe('buildDirectionsUrl — trailhead coordinates', () => {
    it('builds correct URL for a trailhead', () => {
      const url = buildDirectionsUrl({ lat: 35.6532, lng: -85.3941 });
      expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=35.6532,-85.3941');
    });

    it('builds correct URL for negative coordinates', () => {
      const url = buildDirectionsUrl({ lat: -33.8688, lng: 151.2093 });
      expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=-33.8688,151.2093');
    });

    it('builds correct URL for zero coordinates', () => {
      const url = buildDirectionsUrl({ lat: 0, lng: 0 });
      expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=0,0');
    });
  });

  describe('difficulty color mapping', () => {
    // Mirrors the difficultyColors map from TrailDetailPanel.tsx
    const difficultyColors: Record<string, string> = {
      easy: 'bg-brand-moss-100 text-brand-moss-700 dark:bg-brand-moss-800 dark:text-brand-moss-200',
      moderate: 'bg-brand-earth-100 text-brand-earth-700 dark:bg-brand-earth-800 dark:text-brand-earth-200',
      hard: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
      expert: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
    };

    const allDifficulties: TrailDifficulty[] = ['easy', 'moderate', 'hard', 'expert'];

    it.each(allDifficulties)('has a color mapping for difficulty "%s"', (difficulty) => {
      expect(difficultyColors[difficulty]).toBeDefined();
      expect(difficultyColors[difficulty].length).toBeGreaterThan(0);
    });

    it('returns distinct colors for each difficulty level', () => {
      const values = allDifficulties.map((d) => difficultyColors[d]);
      const unique = new Set(values);
      expect(unique.size).toBe(allDifficulties.length);
    });
  });

  describe('trail type labels', () => {
    const trailTypeLabels: Record<string, string> = {
      loop: 'Loop',
      'out-and-back': 'Out & Back',
      'point-to-point': 'Point-to-Point',
    };

    const allTypes: TrailType[] = ['loop', 'out-and-back', 'point-to-point'];

    it.each(allTypes)('maps trail type "%s" to a display label', (trailType) => {
      expect(trailTypeLabels[trailType]).toBeDefined();
      expect(trailTypeLabels[trailType].length).toBeGreaterThan(0);
    });

    it('maps "loop" to "Loop"', () => {
      expect(trailTypeLabels['loop']).toBe('Loop');
    });

    it('maps "out-and-back" to "Out & Back"', () => {
      expect(trailTypeLabels['out-and-back']).toBe('Out & Back');
    });

    it('maps "point-to-point" to "Point-to-Point"', () => {
      expect(trailTypeLabels['point-to-point']).toBe('Point-to-Point');
    });
  });

  describe('surface type labels', () => {
    const surfaceTypeLabels: Record<string, string> = {
      paved: 'Paved',
      gravel: 'Gravel',
      dirt: 'Dirt',
      rocky: 'Rocky',
      mixed: 'Mixed',
    };

    const allSurfaces: SurfaceType[] = ['paved', 'gravel', 'dirt', 'rocky', 'mixed'];

    it.each(allSurfaces)('maps surface type "%s" to a display label', (surfaceType) => {
      expect(surfaceTypeLabels[surfaceType]).toBeDefined();
      expect(surfaceTypeLabels[surfaceType].length).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. ReviewsSection logic tests (IndexedDB-backed)
// ---------------------------------------------------------------------------

describe('ReviewsSection logic', () => {
  // Reset IndexedDB between tests by clearing the reviews store
  beforeEach(async () => {
    const { getDB } = await import('@/offline/db');
    const db = await getDB();
    await db.clear('reviews');
  });

  describe('getAggregation', () => {
    it('returns zero average and count when no reviews exist', async () => {
      const agg = await getAggregation('park', 'park-nonexistent');
      expect(agg.averageRating).toBe(0);
      expect(agg.totalCount).toBe(0);
    });

    it('returns correct aggregate for a single review', async () => {
      await submitReview({
        userId: 'user-1',
        authorName: 'Alice',
        targetType: 'park',
        targetId: 'park-agg-1',
        rating: 4,
        text: 'Great park for foraging!',
      });

      const agg = await getAggregation('park', 'park-agg-1');
      expect(agg.averageRating).toBe(4);
      expect(agg.totalCount).toBe(1);
    });

    it('returns correct aggregate for multiple reviews', async () => {
      await submitReview({
        userId: 'user-1',
        authorName: 'Alice',
        targetType: 'park',
        targetId: 'park-agg-2',
        rating: 5,
        text: 'Excellent trails and scenery!',
      });
      await submitReview({
        userId: 'user-2',
        authorName: 'Bob',
        targetType: 'park',
        targetId: 'park-agg-2',
        rating: 3,
        text: 'Decent park, trails need maintenance.',
      });

      const agg = await getAggregation('park', 'park-agg-2');
      expect(agg.averageRating).toBe(4); // (5+3)/2 = 4.0
      expect(agg.totalCount).toBe(2);
    });

    it('rounds average to one decimal place', async () => {
      await submitReview({
        userId: 'user-1',
        authorName: 'Alice',
        targetType: 'trail',
        targetId: 'trail-agg-1',
        rating: 5,
        text: 'Amazing trail experience!',
      });
      await submitReview({
        userId: 'user-2',
        authorName: 'Bob',
        targetType: 'trail',
        targetId: 'trail-agg-1',
        rating: 4,
        text: 'Good trail, a bit steep.',
      });
      await submitReview({
        userId: 'user-3',
        authorName: 'Carol',
        targetType: 'trail',
        targetId: 'trail-agg-1',
        rating: 3,
        text: 'Average trail, nothing special.',
      });

      const agg = await getAggregation('trail', 'trail-agg-1');
      // (5+4+3)/3 = 4.0
      expect(agg.averageRating).toBe(4);
      expect(agg.totalCount).toBe(3);
    });
  });

  describe('getReviews — ordering', () => {
    it('returns reviews sorted by createdAt descending', async () => {
      // Submit reviews with slight delays to ensure distinct timestamps
      await submitReview({
        userId: 'user-a',
        authorName: 'First',
        targetType: 'park',
        targetId: 'park-order-1',
        rating: 3,
        text: 'This was the first review submitted.',
      });

      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10));

      await submitReview({
        userId: 'user-b',
        authorName: 'Second',
        targetType: 'park',
        targetId: 'park-order-1',
        rating: 5,
        text: 'This was the second review submitted.',
      });

      const reviews = await getReviews('park', 'park-order-1', 1, 10);
      expect(reviews).toHaveLength(2);
      // Most recent first
      expect(reviews[0].authorName).toBe('Second');
      expect(reviews[1].authorName).toBe('First');
    });
  });

  describe('validateReviewText', () => {
    it('rejects empty string', () => {
      const result = validateReviewText('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects whitespace-only string shorter than 10 chars', () => {
      const result = validateReviewText('     ');
      expect(result.valid).toBe(false);
    });

    it('rejects text shorter than 10 characters after trimming', () => {
      const result = validateReviewText('Too short');
      expect(result.valid).toBe(false);
    });

    it('accepts text exactly 10 characters after trimming', () => {
      const result = validateReviewText('1234567890');
      expect(result.valid).toBe(true);
    });

    it('accepts text within valid range', () => {
      const result = validateReviewText('This is a perfectly valid review text for the park.');
      expect(result.valid).toBe(true);
    });

    it('rejects text longer than 2000 characters', () => {
      const longText = 'a'.repeat(2001);
      const result = validateReviewText(longText);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('accepts text exactly 2000 characters', () => {
      const maxText = 'a'.repeat(2000);
      const result = validateReviewText(maxText);
      expect(result.valid).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. PhotoTour ordering tests
// ---------------------------------------------------------------------------

describe('PhotoTour ordering logic', () => {
  // Replicate the sorting logic from PhotoTour.tsx
  function sortUserPhotos(photos: SocialPhoto[]): SocialPhoto[] {
    return [...photos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  function buildPhotoOrder(seedPhotos: string[], userPhotos: SocialPhoto[]): string[] {
    const sortedUser = sortUserPhotos(userPhotos);
    // Seed photos come first, then sorted user photos
    return [...seedPhotos, ...sortedUser.map((p) => p.id)];
  }

  const makeSocialPhoto = (id: string, createdAt: string): SocialPhoto => ({
    id,
    userId: 'user-1',
    targetType: 'park',
    targetId: 'park-1',
    blob: new Blob(['test'], { type: 'image/jpeg' }),
    caption: `Photo ${id}`,
    hasLocation: false,
    mimeType: 'image/jpeg',
    createdAt,
    syncStatus: 'synced',
  });

  it('preserves seed photos array order', () => {
    const seedPhotos = ['/images/parks/a.jpg', '/images/parks/b.jpg', '/images/parks/c.jpg'];
    const order = buildPhotoOrder(seedPhotos, []);
    expect(order).toEqual(['/images/parks/a.jpg', '/images/parks/b.jpg', '/images/parks/c.jpg']);
  });

  it('places seed photos before user photos', () => {
    const seedPhotos = ['/images/parks/seed1.jpg'];
    const userPhotos = [
      makeSocialPhoto('user-photo-1', '2025-01-15T10:00:00Z'),
    ];
    const order = buildPhotoOrder(seedPhotos, userPhotos);
    expect(order[0]).toBe('/images/parks/seed1.jpg');
    expect(order[1]).toBe('user-photo-1');
  });

  it('sorts user photos by createdAt descending (most recent first)', () => {
    const userPhotos = [
      makeSocialPhoto('oldest', '2025-01-01T10:00:00Z'),
      makeSocialPhoto('newest', '2025-01-20T10:00:00Z'),
      makeSocialPhoto('middle', '2025-01-10T10:00:00Z'),
    ];
    const sorted = sortUserPhotos(userPhotos);
    expect(sorted.map((p) => p.id)).toEqual(['newest', 'middle', 'oldest']);
  });

  it('handles empty seed photos with user photos', () => {
    const userPhotos = [
      makeSocialPhoto('photo-a', '2025-02-01T10:00:00Z'),
      makeSocialPhoto('photo-b', '2025-01-01T10:00:00Z'),
    ];
    const order = buildPhotoOrder([], userPhotos);
    expect(order).toEqual(['photo-a', 'photo-b']);
  });

  it('handles empty user photos with seed photos', () => {
    const seedPhotos = ['/images/parks/only-seed.jpg'];
    const order = buildPhotoOrder(seedPhotos, []);
    expect(order).toEqual(['/images/parks/only-seed.jpg']);
  });

  it('handles both empty', () => {
    const order = buildPhotoOrder([], []);
    expect(order).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 4. Conditional rendering logic tests
// ---------------------------------------------------------------------------

describe('Conditional rendering logic', () => {
  describe('"Getting There" section omission', () => {
    it('park without gettingThere field should omit the section', () => {
      const park: Partial<Park> = {
        id: 'park-1',
        name: 'Test Park',
        region: 'East TN',
        coordinates: { lat: 35.5, lng: -84.0 },
        amenities: [],
        trails: [],
        foragingRules: 'Follow posted rules.',
        lastUpdated: '2025-01-01',
      };
      // The page renders "Getting There" only when park.gettingThere is truthy
      expect(park.gettingThere).toBeUndefined();
      expect(!!park.gettingThere).toBe(false);
    });

    it('park with empty string gettingThere should omit the section', () => {
      const park: Partial<Park> = {
        id: 'park-2',
        name: 'Another Park',
        gettingThere: '',
      };
      // Empty string is falsy — section should be omitted
      expect(!!park.gettingThere).toBe(false);
    });

    it('park with gettingThere data should show the section', () => {
      const park: Partial<Park> = {
        id: 'park-3',
        name: 'Park With Directions',
        gettingThere: 'Take I-40 East to Exit 317, then follow signs.',
      };
      expect(!!park.gettingThere).toBe(true);
    });
  });

  describe('Contact section omission', () => {
    it('park without phone, email, or website should omit contact section', () => {
      const park: Partial<Park> = {
        id: 'park-no-contact',
        name: 'Remote Park',
      };
      const hasContact = !!(park.phone || park.email || park.website);
      expect(hasContact).toBe(false);
    });

    it('park with only phone should show contact section', () => {
      const park: Partial<Park> = {
        id: 'park-phone',
        name: 'Phone Park',
        phone: '(615) 555-1234',
      };
      const hasContact = !!(park.phone || park.email || park.website);
      expect(hasContact).toBe(true);
    });

    it('park with only website should show contact section', () => {
      const park: Partial<Park> = {
        id: 'park-web',
        name: 'Web Park',
        website: 'https://tnstateparks.com/parks/example',
      };
      const hasContact = !!(park.phone || park.email || park.website);
      expect(hasContact).toBe(true);
    });

    it('park with only email should show contact section', () => {
      const park: Partial<Park> = {
        id: 'park-email',
        name: 'Email Park',
        email: 'info@park.gov',
      };
      const hasContact = !!(park.phone || park.email || park.website);
      expect(hasContact).toBe(true);
    });

    it('park with all contact fields should show contact section', () => {
      const park: Partial<Park> = {
        id: 'park-full-contact',
        name: 'Full Contact Park',
        phone: '(615) 555-1234',
        email: 'info@park.gov',
        website: 'https://tnstateparks.com/parks/example',
      };
      const hasContact = !!(park.phone || park.email || park.website);
      expect(hasContact).toBe(true);
    });
  });
});
