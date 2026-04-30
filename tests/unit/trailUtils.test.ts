/**
 * Unit tests for trail utility functions: estimateHikingTime and formatHikingTime.
 *
 * Validates: Requirements 6.3
 */

import { describe, it, expect } from 'vitest';
import { estimateHikingTime, formatHikingTime } from '@/utils/trailUtils';

describe('estimateHikingTime', () => {
  it('calculates time for distance only (zero elevation)', () => {
    // 3 miles at 3 mph = 1 hour = 60 minutes
    expect(estimateHikingTime(3, 0)).toBe(60);
  });

  it('calculates time for elevation only (zero distance)', () => {
    // 1000 ft gain = 30 minutes
    expect(estimateHikingTime(0, 1000)).toBe(30);
  });

  it('calculates time for both distance and elevation', () => {
    // 6 miles = 120 min + 2000 ft = 60 min → 180 min
    expect(estimateHikingTime(6, 2000)).toBe(180);
  });

  it('returns 0 for zero distance and zero elevation', () => {
    expect(estimateHikingTime(0, 0)).toBe(0);
  });

  it('clamps negative distance to 0', () => {
    expect(estimateHikingTime(-5, 1000)).toBe(30);
  });

  it('clamps negative elevation to 0', () => {
    expect(estimateHikingTime(3, -500)).toBe(60);
  });

  it('clamps both negative inputs to 0', () => {
    expect(estimateHikingTime(-3, -1000)).toBe(0);
  });

  it('handles fractional distance', () => {
    // 1.5 miles = (1.5/3)*60 = 30 min
    expect(estimateHikingTime(1.5, 0)).toBe(30);
  });

  it('handles fractional elevation', () => {
    // 500 ft = (500/1000)*30 = 15 min
    expect(estimateHikingTime(0, 500)).toBe(15);
  });
});

describe('formatHikingTime', () => {
  it('formats 0 minutes as "0m"', () => {
    expect(formatHikingTime(0)).toBe('0m');
  });

  it('formats minutes-only values', () => {
    expect(formatHikingTime(45)).toBe('45m');
  });

  it('formats hours-only values', () => {
    expect(formatHikingTime(120)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatHikingTime(135)).toBe('2h 15m');
  });

  it('formats exactly 60 minutes as "1h"', () => {
    expect(formatHikingTime(60)).toBe('1h');
  });

  it('clamps negative input to "0m"', () => {
    expect(formatHikingTime(-30)).toBe('0m');
  });

  it('rounds fractional minutes', () => {
    expect(formatHikingTime(45.7)).toBe('46m');
    expect(formatHikingTime(45.3)).toBe('45m');
  });

  it('formats large values correctly', () => {
    // 300 minutes = 5h 0m → "5h"
    expect(formatHikingTime(300)).toBe('5h');
    // 305 minutes = 5h 5m
    expect(formatHikingTime(305)).toBe('5h 5m');
  });
});
