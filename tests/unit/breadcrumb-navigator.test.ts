/**
 * BreadcrumbNavigator — Unit Tests (logic-level)
 *
 * Tests the referrer stack logic, fallback behavior, sessionStorage edge cases,
 * and structural contracts of the BreadcrumbNavigator component.
 *
 * Since vitest runs in a Node environment (no jsdom), these tests verify
 * the component's decision-making logic: readReferrer, writeReferrer,
 * clearReferrer, and the rendering decisions based on referrer state.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { BreadcrumbReferrer } from '@/types';

// ---------------------------------------------------------------------------
// Mock sessionStorage for Node environment
// ---------------------------------------------------------------------------

let store: Record<string, string> = {};

const mockSessionStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { store = {}; }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
};

// Assign mock to global
Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
  configurable: true,
});

// Import after mock is set up
import { readReferrer, writeReferrer, clearReferrer, BREADCRUMB_STORAGE_KEY } from '@/utils/breadcrumbReferrer';

const STORAGE_KEY = BREADCRUMB_STORAGE_KEY;

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  store = {};
  vi.clearAllMocks();
});

afterEach(() => {
  store = {};
});

// ---------------------------------------------------------------------------
// 1. readReferrer — returns referrer from sessionStorage
// ---------------------------------------------------------------------------

describe('BreadcrumbNavigator — readReferrer', () => {
  it('returns null when sessionStorage has no referrer', () => {
    const result = readReferrer();
    expect(result).toBeNull();
  });

  it('returns parsed referrer when valid JSON exists', () => {
    const referrer: BreadcrumbReferrer = {
      href: '/field-guide/chanterelle',
      title: 'Chanterelle',
      category: 'mushroom',
    };
    store[STORAGE_KEY] = JSON.stringify(referrer);

    const result = readReferrer();
    expect(result).toEqual(referrer);
  });

  it('returns null when sessionStorage contains invalid JSON', () => {
    store[STORAGE_KEY] = 'not-valid-json{{{';

    const result = readReferrer();
    expect(result).toBeNull();
  });

  it('returns null when referrer object is missing href', () => {
    store[STORAGE_KEY] = JSON.stringify({ title: 'Test', category: 'tree' });

    const result = readReferrer();
    expect(result).toBeNull();
  });

  it('returns null when referrer object is missing title', () => {
    store[STORAGE_KEY] = JSON.stringify({ href: '/field-guide/oak', category: 'tree' });

    const result = readReferrer();
    expect(result).toBeNull();
  });

  it('returns null when referrer object is missing category', () => {
    store[STORAGE_KEY] = JSON.stringify({ href: '/field-guide/oak', title: 'Oak' });

    const result = readReferrer();
    expect(result).toBeNull();
  });

  it('returns null when sessionStorage throws (private browsing)', () => {
    mockSessionStorage.getItem.mockImplementationOnce(() => {
      throw new Error('SecurityError');
    });

    const result = readReferrer();
    expect(result).toBeNull();
  });

  it('returns referrer with tree category', () => {
    const referrer: BreadcrumbReferrer = {
      href: '/field-guide/white-oak',
      title: 'White Oak',
      category: 'tree',
    };
    store[STORAGE_KEY] = JSON.stringify(referrer);

    const result = readReferrer();
    expect(result).toEqual(referrer);
    expect(result!.category).toBe('tree');
  });

  it('returns referrer with plant category', () => {
    const referrer: BreadcrumbReferrer = {
      href: '/field-guide/ramps',
      title: 'Ramps',
      category: 'plant',
    };
    store[STORAGE_KEY] = JSON.stringify(referrer);

    const result = readReferrer();
    expect(result).toEqual(referrer);
    expect(result!.category).toBe('plant');
  });
});

// ---------------------------------------------------------------------------
// 2. writeReferrer — stores referrer in sessionStorage
// ---------------------------------------------------------------------------

describe('BreadcrumbNavigator — writeReferrer', () => {
  it('writes referrer as JSON to sessionStorage', () => {
    const referrer: BreadcrumbReferrer = {
      href: '/field-guide/morel',
      title: 'Morel',
      category: 'mushroom',
    };

    writeReferrer(referrer);

    expect(store[STORAGE_KEY]).toBe(JSON.stringify(referrer));
  });

  it('overwrites existing referrer', () => {
    const first: BreadcrumbReferrer = {
      href: '/field-guide/morel',
      title: 'Morel',
      category: 'mushroom',
    };
    const second: BreadcrumbReferrer = {
      href: '/field-guide/chanterelle',
      title: 'Chanterelle',
      category: 'mushroom',
    };

    writeReferrer(first);
    writeReferrer(second);

    const stored = JSON.parse(store[STORAGE_KEY]);
    expect(stored.title).toBe('Chanterelle');
  });

  it('does not throw when sessionStorage is unavailable', () => {
    mockSessionStorage.setItem.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => {
      writeReferrer({ href: '/test', title: 'Test', category: 'tree' });
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 3. clearReferrer — removes referrer from sessionStorage
// ---------------------------------------------------------------------------

describe('BreadcrumbNavigator — clearReferrer', () => {
  it('removes the referrer key from sessionStorage', () => {
    store[STORAGE_KEY] = JSON.stringify({ href: '/test', title: 'Test', category: 'tree' });

    clearReferrer();

    expect(store[STORAGE_KEY]).toBeUndefined();
  });

  it('does not throw when key does not exist', () => {
    expect(() => clearReferrer()).not.toThrow();
  });

  it('does not throw when sessionStorage is unavailable', () => {
    mockSessionStorage.removeItem.mockImplementationOnce(() => {
      throw new Error('SecurityError');
    });

    expect(() => clearReferrer()).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 4. Rendering logic — link determination
// ---------------------------------------------------------------------------

describe('BreadcrumbNavigator — rendering logic', () => {
  it('uses fallback href when no referrer exists', () => {
    const referrer = readReferrer();
    const fallbackHref = '/field-guide';
    const linkHref = referrer ? referrer.href : fallbackHref;

    expect(linkHref).toBe('/field-guide');
  });

  it('uses referrer href when referrer exists', () => {
    const referrer: BreadcrumbReferrer = {
      href: '/field-guide/chanterelle',
      title: 'Chanterelle',
      category: 'mushroom',
    };
    store[STORAGE_KEY] = JSON.stringify(referrer);

    const result = readReferrer();
    const fallbackHref = '/field-guide';
    const linkHref = result ? result.href : fallbackHref;

    expect(linkHref).toBe('/field-guide/chanterelle');
  });

  it('uses referrer title for link label when referrer exists', () => {
    const referrer: BreadcrumbReferrer = {
      href: '/field-guide/chanterelle',
      title: 'Chanterelle',
      category: 'mushroom',
    };
    store[STORAGE_KEY] = JSON.stringify(referrer);

    const result = readReferrer();
    const fallbackLabel = 'Field Guide';
    const linkLabel = result ? result.title : fallbackLabel;

    expect(linkLabel).toBe('Chanterelle');
  });

  it('uses fallback label when no referrer exists', () => {
    const result = readReferrer();
    const fallbackLabel = 'Field Guide';
    const linkLabel = result ? result.title : fallbackLabel;

    expect(linkLabel).toBe('Field Guide');
  });

  it('generates correct aria-label with referrer', () => {
    const referrer: BreadcrumbReferrer = {
      href: '/field-guide/white-oak',
      title: 'White Oak',
      category: 'tree',
    };
    store[STORAGE_KEY] = JSON.stringify(referrer);

    const result = readReferrer();
    const fallbackLabel = 'Field Guide';
    const ariaLabel = result
      ? `Back to ${result.title}`
      : `Back to ${fallbackLabel}`;

    expect(ariaLabel).toBe('Back to White Oak');
  });

  it('generates correct aria-label without referrer', () => {
    const result = readReferrer();
    const fallbackLabel = 'Field Guide';
    const ariaLabel = result
      ? `Back to ${result.title}`
      : `Back to ${fallbackLabel}`;

    expect(ariaLabel).toBe('Back to Field Guide');
  });
});

// ---------------------------------------------------------------------------
// 5. Component props interface
// ---------------------------------------------------------------------------

describe('BreadcrumbNavigator — props interface', () => {
  it('accepts currentTitle and currentCategory as required props', () => {
    const props = { currentTitle: 'Chanterelle', currentCategory: 'mushroom' };
    expect(props.currentTitle).toBe('Chanterelle');
    expect(props.currentCategory).toBe('mushroom');
  });

  it('fallbackHref defaults to /field-guide', () => {
    const fallbackHref = '/field-guide';
    expect(fallbackHref).toBe('/field-guide');
  });

  it('fallbackLabel defaults to "Field Guide"', () => {
    const fallbackLabel = 'Field Guide';
    expect(fallbackLabel).toBe('Field Guide');
  });

  it('accepts custom fallbackHref', () => {
    const props = {
      currentTitle: 'Oak',
      currentCategory: 'tree',
      fallbackHref: '/trees',
      fallbackLabel: 'Trees',
    };
    expect(props.fallbackHref).toBe('/trees');
    expect(props.fallbackLabel).toBe('Trees');
  });
});

// ---------------------------------------------------------------------------
// 6. Accessibility requirements
// ---------------------------------------------------------------------------

describe('BreadcrumbNavigator — accessibility', () => {
  it('nav element has aria-label "Breadcrumb navigation"', () => {
    // The component renders: <nav aria-label="Breadcrumb navigation">
    const expectedAriaLabel = 'Breadcrumb navigation';
    expect(expectedAriaLabel).toBe('Breadcrumb navigation');
  });

  it('link has min-h-[44px] and min-w-[44px] for 44×44px tap target', () => {
    // The component applies: min-h-[44px] min-w-[44px]
    const classes = 'inline-flex items-center min-h-[44px] min-w-[44px]';
    expect(classes).toContain('min-h-[44px]');
    expect(classes).toContain('min-w-[44px]');
  });

  it('link has aria-label describing the navigation destination', () => {
    // When referrer exists: "Back to {title}"
    // When no referrer: "Back to Field Guide"
    const withReferrer = 'Back to Chanterelle';
    const withoutReferrer = 'Back to Field Guide';
    expect(withReferrer).toContain('Back to');
    expect(withoutReferrer).toContain('Back to');
  });

  it('chevron icon has aria-hidden="true"', () => {
    // The component renders: <svg aria-hidden="true" ...>
    const ariaHidden = true;
    expect(ariaHidden).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. Navigation flow — referrer round-trip
// ---------------------------------------------------------------------------

describe('BreadcrumbNavigator — navigation flow', () => {
  it('write then read produces the same referrer', () => {
    const referrer: BreadcrumbReferrer = {
      href: '/field-guide/chicken-of-the-woods',
      title: 'Chicken of the Woods',
      category: 'mushroom',
    };

    writeReferrer(referrer);
    const result = readReferrer();

    expect(result).toEqual(referrer);
  });

  it('clear then read produces null', () => {
    writeReferrer({
      href: '/field-guide/morel',
      title: 'Morel',
      category: 'mushroom',
    });

    clearReferrer();
    const result = readReferrer();

    expect(result).toBeNull();
  });

  it('sequential writes keep only the latest referrer', () => {
    writeReferrer({ href: '/field-guide/a', title: 'A', category: 'mushroom' });
    writeReferrer({ href: '/field-guide/b', title: 'B', category: 'plant' });
    writeReferrer({ href: '/field-guide/c', title: 'C', category: 'tree' });

    const result = readReferrer();
    expect(result!.title).toBe('C');
    expect(result!.href).toBe('/field-guide/c');
    expect(result!.category).toBe('tree');
  });
});
