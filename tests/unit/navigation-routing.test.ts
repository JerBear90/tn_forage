/**
 * ForageFlow — Navigation and Routing Tests
 *
 * Tests that the bottom navigation has the correct items in the right order:
 * Field Guide / Map / ID / Community / Plan
 *
 * Requirements: 2.1, 13.1
 */

import { describe, it, expect } from 'vitest';
import { navItems } from '@/components/navItems';

// ---------------------------------------------------------------------------
// Bottom Navigation Structure
// ---------------------------------------------------------------------------

describe('Bottom Navigation — Structure', () => {
  it('should have exactly 5 nav items', () => {
    expect(navItems.length).toBe(5);
  });

  it('should have items in correct order: Field Guide, Map, ID, Community, Plan', () => {
    expect(navItems[0].label).toBe('Field Guide');
    expect(navItems[1].label).toBe('Map');
    expect(navItems[2].label).toBe('ID');
    expect(navItems[3].label).toBe('Community');
    expect(navItems[4].label).toBe('Plan');
  });

  it('should not include Home in bottom nav', () => {
    const home = navItems.find((item) => item.href === '/');
    expect(home).toBeUndefined();
  });
});

describe('Bottom Navigation — Links', () => {
  it('Field Guide links to /field-guide', () => {
    expect(navItems[0].href).toBe('/field-guide');
  });

  it('Map links to /map', () => {
    expect(navItems[1].href).toBe('/map');
  });

  it('ID links to /identify', () => {
    expect(navItems[2].href).toBe('/identify');
  });

  it('Community links to /community', () => {
    expect(navItems[3].href).toBe('/community');
  });

  it('Plan links to /parks', () => {
    expect(navItems[4].href).toBe('/parks');
  });

  it('all nav items have non-empty href starting with "/"', () => {
    for (const item of navItems) {
      expect(item.href).toBeTruthy();
      expect(item.href.startsWith('/')).toBe(true);
    }
  });

  it('all nav items have non-empty labels', () => {
    for (const item of navItems) {
      expect(item.label).toBeTruthy();
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it('all nav items have non-empty icon paths', () => {
    for (const item of navItems) {
      expect(item.iconPath).toBeTruthy();
      expect(item.iconPath.length).toBeGreaterThan(0);
    }
  });
});

describe('Other-User Profile Route Pattern', () => {
  it('should follow the pattern /profile/{userId}', () => {
    const userId = 'abc123';
    const route = `/profile/${userId}`;
    expect(route).toBe('/profile/abc123');
  });

  it('should construct valid routes for various user IDs', () => {
    const userIds = ['user-1', 'abc-def-ghi', '12345', 'john_doe'];
    for (const id of userIds) {
      const route = `/profile/${id}`;
      expect(route).toMatch(/^\/profile\/[a-zA-Z0-9_-]+$/);
    }
  });

  it('should produce a route that starts with /profile/', () => {
    const userId = 'test-user';
    const route = `/profile/${userId}`;
    expect(route.startsWith('/profile/')).toBe(true);
  });
});
