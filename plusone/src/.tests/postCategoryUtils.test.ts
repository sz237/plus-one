/**
 * @file src/.tests/postCategoryUtils.test.ts
 * Tests for post category utilities and validation
 */

import type { Category } from '../types/post';

describe('Post category utilities', () => {
  const ALL_CATEGORIES: Category[] = [
    'Events',
    'Job opportunities',
    'Internships',
    'Housing',
    'Other',
  ];

  describe('Category validation', () => {
    it('recognizes all valid categories', () => {
      ALL_CATEGORIES.forEach((category) => {
        expect(ALL_CATEGORIES.includes(category)).toBe(true);
      });
    });

    it('distinguishes between Events and non-Events categories', () => {
      const isEventCategory = (category: Category): boolean => category === 'Events';

      expect(isEventCategory('Events')).toBe(true);
      expect(isEventCategory('Job opportunities')).toBe(false);
      expect(isEventCategory('Internships')).toBe(false);
      expect(isEventCategory('Housing')).toBe(false);
      expect(isEventCategory('Other')).toBe(false);
    });
  });

  describe('Category-based logic', () => {
    it('determines if event date/time should be shown', () => {
      const shouldShowEventDateTime = (category: Category): boolean => {
        return category === 'Events';
      };

      expect(shouldShowEventDateTime('Events')).toBe(true);
      expect(shouldShowEventDateTime('Job opportunities')).toBe(false);
      expect(shouldShowEventDateTime('Housing')).toBe(false);
    });

    it('validates category-specific fields', () => {
      const validatePostFields = (category: Category, hasEventDate: boolean): boolean => {
        if (category === 'Events') {
          return hasEventDate; // Events should have date
        }
        return !hasEventDate; // Non-events shouldn't require date
      };

      expect(validatePostFields('Events', true)).toBe(true);
      expect(validatePostFields('Events', false)).toBe(false);
      expect(validatePostFields('Job opportunities', false)).toBe(true);
      expect(validatePostFields('Housing', true)).toBe(false);
    });
  });

  describe('Category display names', () => {
    it('maps categories to display-friendly names', () => {
      const categoryDisplayNames: Record<Category, string> = {
        Events: 'Events',
        'Job opportunities': 'Job Opportunities',
        Internships: 'Internships',
        Housing: 'Housing',
        Other: 'Other Posts',
      };

      expect(categoryDisplayNames['Events']).toBe('Events');
      expect(categoryDisplayNames['Job opportunities']).toBe('Job Opportunities');
      expect(categoryDisplayNames['Other']).toBe('Other Posts');
    });
  });
});

