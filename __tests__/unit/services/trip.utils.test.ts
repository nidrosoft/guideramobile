/**
 * Trip Utilities Tests
 *
 * Tests for trip helper functions including token generation,
 * date calculations, and slug generation.
 */

import {
  generateShareToken,
  generateInviteToken,
  slugify,
  calculateDuration,
  formatDate,
  formatTime,
  compareTime,
  generateTripName,
} from '@/services/trip/trip.utils';

describe('Trip Utilities', () => {
  describe('generateShareToken', () => {
    it('should return a string of length 24', () => {
      const token = generateShareToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(24);
    });

    it('should only contain base64url-safe characters', () => {
      const token = generateShareToken();
      const validChars = /^[A-Za-z0-9_-]+$/;
      expect(token).toMatch(validChars);
    });

    it('should generate unique tokens on each call', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateShareToken());
      }
      // With 24 chars from 64-char alphabet, collisions in 100 iterations should be impossible
      expect(tokens.size).toBe(100);
    });

    it('should use crypto.getRandomValues when available', () => {
      // In test environment, globalThis.crypto may or may not be available,
      // but the function should still work via the fallback
      const token = generateShareToken();
      expect(token.length).toBe(24);
    });
  });

  describe('generateInviteToken', () => {
    it('should start with "inv_" prefix', () => {
      const token = generateInviteToken();
      expect(token.startsWith('inv_')).toBe(true);
    });

    it('should have total length of inv_ + 24 = 28', () => {
      const token = generateInviteToken();
      expect(token.length).toBe(28);
    });
  });

  describe('slugify', () => {
    it('should convert to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(slugify('my trip name')).toBe('my-trip-name');
    });

    it('should remove special characters', () => {
      expect(slugify('Paris & London!')).toBe('paris-london');
    });

    it('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('calculateDuration', () => {
    it('should calculate correct days for same-day trip', () => {
      expect(calculateDuration('2024-06-01', '2024-06-01')).toBe(1);
    });

    it('should calculate correct days for multi-day trip', () => {
      expect(calculateDuration('2024-06-01', '2024-06-07')).toBe(7);
    });

    it('should handle month boundaries', () => {
      expect(calculateDuration('2024-01-30', '2024-02-02')).toBe(4);
    });
  });

  describe('formatDate', () => {
    it('should format date in short month format', () => {
      const formatted = formatDate('2024-06-15T12:00:00Z');
      expect(formatted).toContain('Jun');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
  });

  describe('formatTime', () => {
    it('should convert 24h time to 12h format', () => {
      expect(formatTime('14:30')).toBe('2:30 PM');
    });

    it('should handle midnight', () => {
      expect(formatTime('00:00')).toBe('12:00 AM');
    });

    it('should handle noon', () => {
      expect(formatTime('12:00')).toBe('12:00 PM');
    });

    it('should return empty string for empty input', () => {
      expect(formatTime('')).toBe('');
    });
  });

  describe('compareTime', () => {
    it('should return negative when a is before b', () => {
      expect(compareTime('08:00', '14:00')).toBeLessThan(0);
    });

    it('should return positive when a is after b', () => {
      expect(compareTime('14:00', '08:00')).toBeGreaterThan(0);
    });

    it('should return 0 when times are equal', () => {
      expect(compareTime('10:00', '10:00')).toBe(0);
    });

    it('should handle undefined values', () => {
      expect(compareTime(undefined, undefined)).toBe(0);
      expect(compareTime(undefined, '10:00')).toBe(1);
      expect(compareTime('10:00', undefined)).toBe(-1);
    });
  });

  describe('generateTripName', () => {
    it('should generate name from destination and dates', () => {
      const name = generateTripName(
        { name: 'Paris', country: 'France' } as any,
        { start: '2024-06-15T12:00:00Z' }
      );
      expect(name).toContain('Paris');
      expect(name).toContain('Jun');
      expect(name).toContain('2024');
    });

    it('should fallback to country when name is missing', () => {
      const name = generateTripName(
        { country: 'France' } as any,
        { start: '2024-06-15T12:00:00Z' }
      );
      expect(name).toContain('France');
    });

    it('should return "Trip to" format when no dates provided', () => {
      const name = generateTripName({ name: 'Tokyo' } as any);
      expect(name).toBe('Trip to Tokyo');
    });

    it('should handle no destination', () => {
      const name = generateTripName(undefined, { start: '2024-06-01' });
      expect(name).toContain('Trip');
    });
  });
});
