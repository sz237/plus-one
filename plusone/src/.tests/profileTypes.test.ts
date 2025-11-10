/**
 * @file src/.tests/profileTypes.test.ts
 *
 * Purpose:
 *  - Exercise the only runtime value in the types module (GENDER_VALUES)
 *  - Sanity-check that a representative ProfileResponse object shape is usable at runtime
 */

import { GENDER_VALUES } from '@/types/profile'; // <-- change to '@/styles/profile' if that's your real path

describe('types/profile runtime exports', () => {
  it('GENDER_VALUES has exact values in the expected order', () => {
    expect(GENDER_VALUES).toEqual([
      'MALE',
      'FEMALE',
      'NON_BINARY',
      'OTHER',
      'PREFER_NOT_TO_SAY',
    ]);

    // A couple of basic invariants
    expect(Array.isArray(GENDER_VALUES)).toBe(true);
    expect(new Set(GENDER_VALUES).size).toBe(GENDER_VALUES.length); // no dups
  });

  it('a representative ProfileResponse-like object has the expected runtime shape', () => {
    // We can’t assert TypeScript types at runtime, but we can validate the structure
    const example = {
      userId: 'u1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      connectionsCount: 2,
      requestsCount: 1,
      postsCount: 0,
      posts: [],
      profile: {
        gender: 'FEMALE',
        age: 22,
        location: { city: 'Nashville', state: 'TN', country: 'US', latitude: null, longitude: null },
        job: { title: 'Engineer', companiesName: 'Vanderbilt', companyId: '42' },
        interests: ['Coffee Chats'],
        profilePhoto: { storage: 'stock', key: 'default', url: 'https://x/y.png' },
        numConnections: 0,
        numRequests: 0,
      },
      onboarding: { completed: false, step: 1, completedAt: null },
    };

    // Minimal runtime checks:
    expect(typeof example.userId).toBe('string');
    expect(typeof example.profile.location.city).toBe('string');
    expect(Array.isArray(example.posts)).toBe(true);
    expect(typeof example.onboarding.completed).toBe('boolean');
    expect(example.profilePhoto?.url ?? example.profile.profilePhoto.url).toBeDefined();
  });
});