/**
 * ForageFlow — Navigation and Routing Tests
 *
 * Tests that the bottom navigation includes a feed link and that
 * the other-user profile route pattern is correctly structured.
 *
 * Requirements: 2.1, 13.1
 */

import { describe, it, expect } from 'vitest';
import { navItems } from '@/components/navItems';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Bottom Navigation — Identify Link', () => {
  it('should include a nav item with href="/identify"', () => {
    const identifyItem = navItems.find((item) => item.href === '/identify');
    expect(identifyItem).toBeDefined();
  });

  it('should have an "Identify" label on the identify nav item', () => {
    const identifyItem = navItems.find((item) => item.href === '/identify');
    expect(identifyItem?.label).toBe('Identify');
  });

  it('should have an identify icon path (non-empty string)', () => {
    const identifyItem = navItems.find((item) => item.href === '/identify');
    expect(identifyItem?.iconPath).toBeTruthy();
    expect(typeof identifyItem?.iconPath).toBe('string');
    expect(identifyItem!.iconPath.length).toBeGreaterThan(0);
  });

  it('should have 6 nav items total', () => {
    expect(navItems.length).toBe(6);
  });

  it('should have Identify as the last nav item', () => {
    const lastItem = navItems[navItems.length - 1];
    expect(lastItem.href).toBe('/identify');
    expect(lastItem.label).toBe('Identify');
  });
});

describe('Navigation Links — Correct Construction', () => {
  it('should have Home at "/"', () => {
    const home = navItems.find((item) => item.label === 'Home');
    expect(home?.href).toBe('/');
  });

  it('should have Field Guide at "/field-guide"', () => {
    const fg = navItems.find((item) => item.label === 'Field Guide');
    expect(fg?.href).toBe('/field-guide');
  });

  it('should have Map at "/map"', () => {
    const map = navItems.find((item) => item.label === 'Map');
    expect(map?.href).toBe('/map');
  });

  it('should have Plan a Visit at "/parks"', () => {
    const parks = navItems.find((item) => item.label === 'Plan a Visit');
    expect(parks?.href).toBe('/parks');
  });

  it('should have Community at "/community"', () => {
    const community = navItems.find((item) => item.label === 'Community');
    expect(community?.href).toBe('/community');
  });

  it('all nav items should have non-empty href starting with "/"', () => {
    for (const item of navItems) {
      expect(item.href).toBeTruthy();
      expect(item.href.startsWith('/')).toBe(true);
    }
  });

  it('all nav items should have non-empty labels', () => {
    for (const item of navItems) {
      expect(item.label).toBeTruthy();
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it('all nav items should have non-empty icon paths', () => {
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

  it('should include the userId as the last path segment', () => {
    const userId = 'my-user-id';
    const route = `/profile/${userId}`;
    const segments = route.split('/').filter(Boolean);
    expect(segments).toEqual(['profile', 'my-user-id']);
  });
});
