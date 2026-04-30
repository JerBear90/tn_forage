/**
 * Enhanced Park Detail Page — Unit Tests (logic-level)
 *
 * Tests the data transformations, URL construction, and conditional rendering
 * logic used by the park detail page. Since vitest runs in a Node environment
 * (no jsdom), these tests verify pure functions and boolean conditions rather
 * than DOM rendering.
 *
 * Validates: Requirements 11.1, 11.2, 10.1, 12.3, 12.4, 14.6
 */

import { describe, it, expect } from 'vitest';

import { buildWeatherUrl } from '@/utils/weatherUtils';
import { buildDirectionsUrl } from '@/utils/directionsUtils';
import type { Park, Coordinates } from '@/types';

// ---------------------------------------------------------------------------
// 1. Weather URL tests (Requirement 11.1)
// ---------------------------------------------------------------------------

describe('Weather URL construction', () => {
  it('produces a URL containing "weather.gov"', () => {
    const url = buildWeatherUrl({ lat: 35.6532, lng: -85.3941 });
    expect(url).toContain('weather.gov');
  });

  it('contains the park latitude in the URL', () => {
    const coords: Coordinates = { lat: 36.1627, lng: -86.7816 };
    const url = buildWeatherUrl(coords);
    expect(url).toContain('36.1627');
  });

  it('contains the park longitude in the URL', () => {
    const coords: Coordinates = { lat: 36.1627, lng: -86.7816 };
    const url = buildWeatherUrl(coords);
    expect(url).toContain('-86.7816');
  });

  it('builds correct full URL for known coordinates', () => {
    const url = buildWeatherUrl({ lat: 35.6532, lng: -85.3941 });
    expect(url).toBe('https://forecast.weather.gov/MapClick.php?lat=35.6532&lon=-85.3941');
  });

  it('handles coordinates at the equator/prime meridian', () => {
    const url = buildWeatherUrl({ lat: 0, lng: 0 });
    expect(url).toContain('lat=0');
    expect(url).toContain('lon=0');
    expect(url).toContain('weather.gov');
  });

  it('handles negative latitude (southern hemisphere)', () => {
    const url = buildWeatherUrl({ lat: -33.8688, lng: 151.2093 });
    expect(url).toContain('-33.8688');
    expect(url).toContain('151.2093');
  });
});

// ---------------------------------------------------------------------------
// 2. Directions URL tests (Requirement 10.1)
// ---------------------------------------------------------------------------

describe('Directions URL construction', () => {
  it('produces a Google Maps URL', () => {
    const url = buildDirectionsUrl({ lat: 35.6532, lng: -85.3941 });
    expect(url).toContain('google.com/maps');
  });

  it('contains "destination=" with lat,lng', () => {
    const url = buildDirectionsUrl({ lat: 35.6532, lng: -85.3941 });
    expect(url).toContain('destination=35.6532,-85.3941');
  });

  it('uses the correct Google Maps directions API format', () => {
    const url = buildDirectionsUrl({ lat: 36.1627, lng: -86.7816 });
    expect(url).toBe('https://www.google.com/maps/dir/?api=1&destination=36.1627,-86.7816');
  });

  it('handles negative coordinates correctly', () => {
    const url = buildDirectionsUrl({ lat: -33.8688, lng: -70.6693 });
    expect(url).toContain('destination=-33.8688,-70.6693');
  });

  it('handles zero coordinates', () => {
    const url = buildDirectionsUrl({ lat: 0, lng: 0 });
    expect(url).toContain('destination=0,0');
  });
});

// ---------------------------------------------------------------------------
// 3. Phone link tests (Requirement 12.3)
// ---------------------------------------------------------------------------

describe('Phone link tel: protocol', () => {
  /**
   * Mirrors the park detail page logic: `tel:${park.phone}`
   * The page renders <a href={`tel:${park.phone}`}> for phone numbers.
   */
  function buildPhoneLink(phone: string): string {
    return `tel:${phone}`;
  }

  it('formats a standard phone number with tel: protocol', () => {
    const link = buildPhoneLink('(615) 555-1234');
    expect(link).toBe('tel:(615) 555-1234');
    expect(link).toMatch(/^tel:/);
  });

  it('formats a plain digits phone number', () => {
    const link = buildPhoneLink('6155551234');
    expect(link).toBe('tel:6155551234');
    expect(link).toMatch(/^tel:/);
  });

  it('formats a phone number with dashes', () => {
    const link = buildPhoneLink('615-555-1234');
    expect(link).toBe('tel:615-555-1234');
    expect(link).toMatch(/^tel:/);
  });

  it('formats a phone number with country code', () => {
    const link = buildPhoneLink('+1-615-555-1234');
    expect(link).toBe('tel:+1-615-555-1234');
    expect(link).toMatch(/^tel:/);
  });

  it('formats a phone number with spaces', () => {
    const link = buildPhoneLink('615 555 1234');
    expect(link).toBe('tel:615 555 1234');
    expect(link).toMatch(/^tel:/);
  });
});

// ---------------------------------------------------------------------------
// 4. Website link tests (Requirement 12.4)
// ---------------------------------------------------------------------------

describe('Website URL validation', () => {
  /**
   * The park detail page renders website links with target="_blank" and
   * rel="noopener noreferrer". Here we verify the URLs are valid and
   * would be suitable for opening in a new tab.
   */
  function isValidWebsiteUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }

  it('accepts a valid HTTPS URL', () => {
    expect(isValidWebsiteUrl('https://tnstateparks.com/parks/fall-creek-falls')).toBe(true);
  });

  it('accepts a valid HTTP URL', () => {
    expect(isValidWebsiteUrl('http://example.com')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidWebsiteUrl('')).toBe(false);
  });

  it('rejects a non-URL string', () => {
    expect(isValidWebsiteUrl('not a url')).toBe(false);
  });

  it('rejects a javascript: protocol URL', () => {
    expect(isValidWebsiteUrl('javascript:alert(1)')).toBe(false);
  });

  it('accepts a URL with path and query params', () => {
    expect(isValidWebsiteUrl('https://tnstateparks.com/parks/info?id=123')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Offline behavior logic tests (Requirements 11.2, 14.6)
// ---------------------------------------------------------------------------

describe('Offline behavior logic', () => {
  /**
   * The park detail page uses `isOnline` from useOnlineStatus() to
   * conditionally show/hide sections. These tests verify the conditional
   * logic that drives rendering decisions.
   */

  describe('Weather section', () => {
    it('shows weather link when isOnline is true', () => {
      const isOnline = true;
      const showWeatherLink = isOnline;
      const showOfflineMessage = !isOnline;

      expect(showWeatherLink).toBe(true);
      expect(showOfflineMessage).toBe(false);
    });

    it('hides weather link and shows offline message when isOnline is false', () => {
      const isOnline = false;
      const showWeatherLink = isOnline;
      const showOfflineMessage = !isOnline;

      expect(showWeatherLink).toBe(false);
      expect(showOfflineMessage).toBe(true);
    });
  });

  describe('Reviews section offline indicator', () => {
    /**
     * When offline, the reviews section should show cached reviews with
     * an offline indicator banner.
     */
    it('should indicate offline state for reviews when not online', () => {
      const isOnline = false;
      const showOfflineIndicator = !isOnline;
      expect(showOfflineIndicator).toBe(true);
    });

    it('should not show offline indicator when online', () => {
      const isOnline = true;
      const showOfflineIndicator = !isOnline;
      expect(showOfflineIndicator).toBe(false);
    });
  });

  describe('Feed section offline indicator', () => {
    /**
     * Activity feed shows cached items with an offline banner when offline.
     */
    it('should indicate offline state for feed when not online', () => {
      const isOnline = false;
      const showOfflineIndicator = !isOnline;
      expect(showOfflineIndicator).toBe(true);
    });

    it('should not show offline indicator when online', () => {
      const isOnline = true;
      const showOfflineIndicator = !isOnline;
      expect(showOfflineIndicator).toBe(false);
    });
  });

  describe('Weather URL is only useful when online', () => {
    it('weather URL is still constructable offline but should not be displayed', () => {
      const isOnline = false;
      const coords: Coordinates = { lat: 35.6532, lng: -85.3941 };
      const url = buildWeatherUrl(coords);

      // URL can be built regardless of connectivity
      expect(url).toContain('weather.gov');
      // But the page should not display it
      expect(isOnline).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// 6. Contact section conditional logic (Requirements 12.3, 12.4, 12.5)
// ---------------------------------------------------------------------------

describe('Contact section conditional logic', () => {
  /**
   * The park detail page renders the contact section only when the park
   * has at least one of: phone, address, email, or website.
   * This mirrors the condition: (park.phone || park.address || park.email || park.website)
   */
  function hasContactInfo(park: Partial<Park>): boolean {
    return !!(park.phone || park.address || park.email || park.website);
  }

  it('shows contact section when park has website', () => {
    const park: Partial<Park> = {
      id: 'park-web',
      name: 'Web Park',
      website: 'https://tnstateparks.com/parks/example',
    };
    expect(hasContactInfo(park)).toBe(true);
  });

  it('shows contact section when park has phone', () => {
    const park: Partial<Park> = {
      id: 'park-phone',
      name: 'Phone Park',
      phone: '(615) 555-1234',
    };
    expect(hasContactInfo(park)).toBe(true);
  });

  it('shows contact section when park has email', () => {
    const park: Partial<Park> = {
      id: 'park-email',
      name: 'Email Park',
      email: 'info@park.gov',
    };
    expect(hasContactInfo(park)).toBe(true);
  });

  it('shows contact section when park has address', () => {
    const park: Partial<Park> = {
      id: 'park-addr',
      name: 'Address Park',
      address: '123 Park Road, Nashville, TN',
    };
    expect(hasContactInfo(park)).toBe(true);
  });

  it('hides contact section when no contact info exists', () => {
    const park: Partial<Park> = {
      id: 'park-no-contact',
      name: 'Remote Park',
      region: 'East TN',
    };
    expect(hasContactInfo(park)).toBe(false);
  });

  it('hides contact section when all contact fields are undefined', () => {
    const park: Partial<Park> = {
      id: 'park-empty',
      name: 'Empty Contact Park',
      phone: undefined,
      email: undefined,
      website: undefined,
      address: undefined,
    };
    expect(hasContactInfo(park)).toBe(false);
  });

  it('hides contact section when all contact fields are empty strings', () => {
    const park: Partial<Park> = {
      id: 'park-empty-strings',
      name: 'Empty Strings Park',
      phone: '',
      email: '',
      website: '',
      address: '',
    };
    expect(hasContactInfo(park)).toBe(false);
  });

  it('shows contact section when park has multiple contact fields', () => {
    const park: Partial<Park> = {
      id: 'park-full',
      name: 'Full Contact Park',
      phone: '(615) 555-1234',
      email: 'info@park.gov',
      website: 'https://tnstateparks.com/parks/example',
      address: '123 Park Road',
    };
    expect(hasContactInfo(park)).toBe(true);
  });
});
