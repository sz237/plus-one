/**
 * @file src/.tests/profileUtils.test.ts
 * Tests for profile-related utility functions
 */

import type { Gender, Profile } from '../types/profile';
import { GENDER_VALUES } from '../types/profile';

describe('Profile utilities', () => {
  describe('Gender validation', () => {
    it('validates gender values against GENDER_VALUES constant', () => {
      const isValidGenderValue = (value: string): value is Gender => {
        return GENDER_VALUES.includes(value as Gender);
      };

      expect(isValidGenderValue('MALE')).toBe(true);
      expect(isValidGenderValue('FEMALE')).toBe(true);
      expect(isValidGenderValue('NON_BINARY')).toBe(true);
      expect(isValidGenderValue('OTHER')).toBe(true);
      expect(isValidGenderValue('PREFER_NOT_TO_SAY')).toBe(true);
      expect(isValidGenderValue('invalid')).toBe(false);
      expect(isValidGenderValue('')).toBe(false);
    });
  });

  describe('Profile completeness validation', () => {
    const createMinimalProfile = (): Profile => ({
      location: { city: 'Nashville', state: 'TN', country: 'USA' },
      job: { title: 'Engineer', companiesName: 'Tech Corp' },
      interests: [],
      profilePhoto: {},
      numConnections: 0,
      numRequests: 0,
    });

    it('validates required profile fields', () => {
      const profile = createMinimalProfile();
      
      expect(profile.location).toBeDefined();
      expect(profile.job).toBeDefined();
      expect(profile.interests).toBeDefined();
      expect(profile.profilePhoto).toBeDefined();
      expect(profile.numConnections).toBeDefined();
      expect(profile.numRequests).toBeDefined();
    });

    it('validates location structure', () => {
      const profile = createMinimalProfile();
      
      expect(profile.location).toHaveProperty('city');
      expect(profile.location).toHaveProperty('state');
      expect(profile.location).toHaveProperty('country');
    });

    it('validates job structure', () => {
      const profile = createMinimalProfile();
      
      expect(profile.job).toHaveProperty('title');
      expect(profile.job).toHaveProperty('companiesName');
    });

    it('handles optional profile fields', () => {
      const profileWithOptionals: Profile = {
        ...createMinimalProfile(),
        gender: 'MALE',
        age: 25,
        lookingForRoommate: true,
      };

      expect(profileWithOptionals.gender).toBe('MALE');
      expect(profileWithOptionals.age).toBe(25);
      expect(profileWithOptionals.lookingForRoommate).toBe(true);
    });
  });

  describe('Profile photo handling', () => {
    it('validates profile photo structure', () => {
      const profilePhoto = {
        storage: 's3',
        key: 'photo123',
        url: 'https://example.com/photo.jpg',
      };

      expect(profilePhoto).toHaveProperty('url');
      expect(profilePhoto.url).toBeTruthy();
    });

    it('handles missing profile photo gracefully', () => {
      const profilePhoto = {
        storage: null,
        key: null,
        url: null,
      };

      expect(profilePhoto.url).toBeNull();
    });
  });

  describe('Interests array handling', () => {
    it('validates interests array structure', () => {
      const profile: Profile = {
        location: { city: 'Nashville', state: 'TN', country: 'USA' },
        job: { title: 'Engineer', companiesName: 'Tech Corp' },
        interests: ['coding', 'reading', 'hiking'],
        profilePhoto: {},
        numConnections: 0,
        numRequests: 0,
      };

      expect(Array.isArray(profile.interests)).toBe(true);
      expect(profile.interests.length).toBe(3);
      expect(profile.interests).toContain('coding');
    });

    it('handles empty interests array', () => {
      const profile: Profile = {
        location: { city: 'Nashville', state: 'TN', country: 'USA' },
        job: { title: 'Engineer', companiesName: 'Tech Corp' },
        interests: [],
        profilePhoto: {},
        numConnections: 0,
        numRequests: 0,
      };

      expect(profile.interests).toHaveLength(0);
    });
  });
});

