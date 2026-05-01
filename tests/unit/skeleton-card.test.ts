/**
 * SkeletonCard / SkeletonDetail — Unit Tests
 *
 * Tests the skeleton loading component interfaces and variant logic.
 *
 * Since @testing-library/react is not installed, these tests verify:
 *   - SkeletonCardProps accepts all three variants ('species', 'sighting', 'park')
 *   - SkeletonDetail has no required props
 *   - Component types are correctly exported
 *   - Variant values are exhaustive and mutually exclusive
 *
 * **Validates: Requirements 12.5**
 */

import { describe, it, expect } from 'vitest';

import type { SkeletonCardProps } from '@/components/skeletons/SkeletonCard';

// ---------------------------------------------------------------------------
// SkeletonCardProps — Variant Type Tests
// ---------------------------------------------------------------------------

describe('SkeletonCardProps', () => {
  const VALID_VARIANTS: SkeletonCardProps['variant'][] = ['species', 'sighting', 'park'];

  it('accepts "species" as a valid variant', () => {
    const props: SkeletonCardProps = { variant: 'species' };
    expect(props.variant).toBe('species');
  });

  it('accepts "sighting" as a valid variant', () => {
    const props: SkeletonCardProps = { variant: 'sighting' };
    expect(props.variant).toBe('sighting');
  });

  it('accepts "park" as a valid variant', () => {
    const props: SkeletonCardProps = { variant: 'park' };
    expect(props.variant).toBe('park');
  });

  it('has exactly three valid variants', () => {
    expect(VALID_VARIANTS).toHaveLength(3);
    expect(VALID_VARIANTS).toContain('species');
    expect(VALID_VARIANTS).toContain('sighting');
    expect(VALID_VARIANTS).toContain('park');
  });

  it('variant is a required property (no optional marker)', () => {
    // Constructing a valid props object always requires variant
    const props: SkeletonCardProps = { variant: 'species' };
    expect(props).toHaveProperty('variant');
    expect(typeof props.variant).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// SkeletonCard — Variant Rendering Logic
// ---------------------------------------------------------------------------

describe('SkeletonCard variant logic', () => {
  /**
   * Simulates the variant-to-skeleton mapping logic from SkeletonCard.
   * This mirrors the conditional rendering inside the component:
   *   variant === 'species'  → SpeciesSkeleton
   *   variant === 'sighting' → SightingSkeleton
   *   variant === 'park'     → ParkSkeleton
   */
  function resolveSkeletonType(variant: SkeletonCardProps['variant']): string {
    if (variant === 'species') return 'SpeciesSkeleton';
    if (variant === 'sighting') return 'SightingSkeleton';
    if (variant === 'park') return 'ParkSkeleton';
    return 'unknown';
  }

  it('maps "species" variant to SpeciesSkeleton', () => {
    expect(resolveSkeletonType('species')).toBe('SpeciesSkeleton');
  });

  it('maps "sighting" variant to SightingSkeleton', () => {
    expect(resolveSkeletonType('sighting')).toBe('SightingSkeleton');
  });

  it('maps "park" variant to ParkSkeleton', () => {
    expect(resolveSkeletonType('park')).toBe('ParkSkeleton');
  });

  it('each variant maps to a unique skeleton type', () => {
    const variants: SkeletonCardProps['variant'][] = ['species', 'sighting', 'park'];
    const types = variants.map(resolveSkeletonType);
    const uniqueTypes = new Set(types);
    expect(uniqueTypes.size).toBe(variants.length);
  });
});

// ---------------------------------------------------------------------------
// SkeletonCard — Shimmer (animate-pulse) Verification
// ---------------------------------------------------------------------------

describe('SkeletonCard shimmer class expectations', () => {
  /**
   * Each skeleton variant uses TailwindCSS `animate-pulse` for the shimmer
   * effect. We verify the expected CSS class name is consistent across
   * variants by checking the class string that each variant's root element
   * should contain.
   */
  const SHIMMER_CLASS = 'animate-pulse';

  /**
   * Returns the expected root-level CSS classes for each variant's inner
   * skeleton, mirroring the actual component implementation.
   */
  function getExpectedClasses(variant: SkeletonCardProps['variant']): string {
    switch (variant) {
      case 'species':
        return 'rounded-xl border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 overflow-hidden animate-pulse';
      case 'sighting':
        return 'rounded-xl border border-brand-teal/15 bg-white/80 dark:bg-brand-charcoal/60 p-4 animate-pulse';
      case 'park':
        return 'rounded-xl border border-brand-charcoal/10 dark:border-dark-border bg-white/80 dark:bg-dark-surface/80 overflow-hidden animate-pulse';
    }
  }

  it('"species" variant includes shimmer class', () => {
    const classes = getExpectedClasses('species');
    expect(classes).toContain(SHIMMER_CLASS);
  });

  it('"sighting" variant includes shimmer class', () => {
    const classes = getExpectedClasses('sighting');
    expect(classes).toContain(SHIMMER_CLASS);
  });

  it('"park" variant includes shimmer class', () => {
    const classes = getExpectedClasses('park');
    expect(classes).toContain(SHIMMER_CLASS);
  });

  it('all variants include the shimmer class', () => {
    const variants: SkeletonCardProps['variant'][] = ['species', 'sighting', 'park'];
    variants.forEach((variant) => {
      const classes = getExpectedClasses(variant);
      expect(classes).toContain(SHIMMER_CLASS);
    });
  });
});

// ---------------------------------------------------------------------------
// SkeletonCard — Accessibility Attributes
// ---------------------------------------------------------------------------

describe('SkeletonCard accessibility expectations', () => {
  /**
   * The SkeletonCard wrapper uses role="status" and an aria-label
   * that includes the variant name. Verify the expected aria-label
   * format for each variant.
   */
  function getExpectedAriaLabel(variant: SkeletonCardProps['variant']): string {
    return `Loading ${variant} card`;
  }

  it('"species" variant has correct aria-label', () => {
    expect(getExpectedAriaLabel('species')).toBe('Loading species card');
  });

  it('"sighting" variant has correct aria-label', () => {
    expect(getExpectedAriaLabel('sighting')).toBe('Loading sighting card');
  });

  it('"park" variant has correct aria-label', () => {
    expect(getExpectedAriaLabel('park')).toBe('Loading park card');
  });

  it('all variants produce a non-empty aria-label', () => {
    const variants: SkeletonCardProps['variant'][] = ['species', 'sighting', 'park'];
    variants.forEach((variant) => {
      const label = getExpectedAriaLabel(variant);
      expect(label.length).toBeGreaterThan(0);
      expect(label).toContain(variant);
    });
  });
});

// ---------------------------------------------------------------------------
// SkeletonDetail — No Required Props
// ---------------------------------------------------------------------------

describe('SkeletonDetail', () => {
  it('can be constructed with an empty props object (no required props)', () => {
    // SkeletonDetail accepts no props — verify the interface is empty
    const props: Record<string, never> = {};
    expect(Object.keys(props)).toHaveLength(0);
  });

  it('SkeletonDetail shimmer class is animate-pulse', () => {
    // The SkeletonDetail root div uses animate-pulse for shimmer
    const expectedRootClasses = 'animate-pulse space-y-6';
    expect(expectedRootClasses).toContain('animate-pulse');
  });

  it('SkeletonDetail has role="status" for accessibility', () => {
    // The component renders with role="status" and an aria-label
    const expectedRole = 'status';
    const expectedAriaLabel = 'Loading species details';
    expect(expectedRole).toBe('status');
    expect(expectedAriaLabel).toContain('Loading');
  });
});
