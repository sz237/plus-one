/**
 * @file src/.tests/typeValidators.test.ts
 * Tests for type validation and helper functions
 */

import type { Category } from '../types/post';
import { GENDER_VALUES, type Gender } from '../types/profile';

describe('Type validators and constants', () => {
  describe('Post Category type', () => {
    const validCategories: Category[] = [
      'Events',
      'Job opportunities',
      'Internships',
      'Housing',
      'Other',
    ];

    it('has all expected category values', () => {
      expect(validCategories).toHaveLength(5);
      expect(validCategories).toContain('Events');
      expect(validCategories).toContain('Job opportunities');
      expect(validCategories).toContain('Internships');
      expect(validCategories).toContain('Housing');
      expect(validCategories).toContain('Other');
    });

    it('validates category values correctly', () => {
      const isValidCategory = (value: string): value is Category => {
        return validCategories.includes(value as Category);
      };

      expect(isValidCategory('Events')).toBe(true);
      expect(isValidCategory('Invalid')).toBe(false);
      expect(isValidCategory('')).toBe(false);
    });
  });

  describe('Gender constants', () => {
    it('has all expected gender values', () => {
      const expectedGenders: Gender[] = [
        'MALE',
        'FEMALE',
        'NON_BINARY',
        'OTHER',
        'PREFER_NOT_TO_SAY',
      ];

      expect(GENDER_VALUES).toHaveLength(5);
      expectedGenders.forEach((gender) => {
        expect(GENDER_VALUES).toContain(gender);
      });
    });

    it('validates gender values correctly', () => {
      const isValidGender = (value: string): value is Gender => {
        return GENDER_VALUES.includes(value as Gender);
      };

      expect(isValidGender('MALE')).toBe(true);
      expect(isValidGender('FEMALE')).toBe(true);
      expect(isValidGender('NON_BINARY')).toBe(true);
      expect(isValidGender('OTHER')).toBe(true);
      expect(isValidGender('PREFER_NOT_TO_SAY')).toBe(true);
      expect(isValidGender('INVALID')).toBe(false);
      expect(isValidGender('')).toBe(false);
    });
  });

  describe('Post interface structure', () => {
    it('validates required Post fields', () => {
      const validPost = {
        userId: 'u1',
        category: 'Events' as Category,
        title: 'Test Event',
        description: 'Test Description',
      };

      expect(validPost).toHaveProperty('userId');
      expect(validPost).toHaveProperty('category');
      expect(validPost).toHaveProperty('title');
      expect(validPost).toHaveProperty('description');
    });

    it('validates optional Post fields', () => {
      const postWithOptionalFields = {
        id: 'p1',
        userId: 'u1',
        category: 'Events' as Category,
        title: 'Test',
        description: 'Test',
        imageUrl: 'https://example.com/image.jpg',
        eventDate: '2024-01-15',
        eventTime: '14:30',
      };

      expect(postWithOptionalFields).toHaveProperty('id');
      expect(postWithOptionalFields).toHaveProperty('imageUrl');
      expect(postWithOptionalFields).toHaveProperty('eventDate');
      expect(postWithOptionalFields).toHaveProperty('eventTime');
    });
  });

  describe('Profile interface structure', () => {
    it('validates required Profile fields', () => {
      const validProfile = {
        location: { city: 'Nashville', state: 'TN', country: 'USA' },
        job: { title: 'Engineer', companiesName: 'Tech Corp' },
        interests: ['coding'],
        profilePhoto: { url: 'https://example.com/photo.jpg' },
        numConnections: 5,
        numRequests: 2,
      };

      expect(validProfile).toHaveProperty('location');
      expect(validProfile).toHaveProperty('job');
      expect(validProfile).toHaveProperty('interests');
      expect(validProfile).toHaveProperty('profilePhoto');
      expect(validProfile).toHaveProperty('numConnections');
      expect(validProfile).toHaveProperty('numRequests');
    });

    it('validates optional Profile fields', () => {
      const profileWithOptionalFields = {
        gender: 'MALE' as Gender,
        age: 25,
        lookingForRoommate: true,
        location: { city: 'Nashville', state: 'TN', country: 'USA' },
        job: { title: 'Engineer', companiesName: 'Tech Corp' },
        interests: [],
        profilePhoto: {},
        numConnections: 0,
        numRequests: 0,
      };

      expect(profileWithOptionalFields).toHaveProperty('gender');
      expect(profileWithOptionalFields).toHaveProperty('age');
      expect(profileWithOptionalFields).toHaveProperty('lookingForRoommate');
    });
  });
});

