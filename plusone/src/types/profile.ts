import type { Post } from "./post";

export type Gender =
  | "MALE"
  | "FEMALE"
  | "NON_BINARY"
  | "OTHER"
  | "PREFER_NOT_TO_SAY";

export const GENDER_VALUES: Gender[] = [
  "MALE",
  "FEMALE",
  "NON_BINARY",
  "OTHER",
  "PREFER_NOT_TO_SAY",
];

export interface Location {
  city: string;
  state: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Job {
  title: string;
  companiesName: string;
  companyId?: string | null;
}

export interface Photo {
  storage?: string | null;
  key?: string | null;
  url?: string | null;
}

export interface Profile {
  gender?: Gender | null;
  age?: number | null;
  location: Location;
  job: Job;
  interests: string[];
  profilePhoto: Photo;
  numConnections: number;
  numRequests: number;
}

export interface Onboarding {
  completed: boolean;
  step: number;
  completedAt?: string | null;
}

export interface ProfileResponse {
  userId: string;
  firstName: string;
  lastName: string;
  connectionsCount: number;
  requestsCount: number;
  postsCount: number;
  posts: Post[];
  profile: Profile;
  onboarding: Onboarding;
}

export interface ProfileUpdatePayload {
  profile: Profile;
  step?: number;
  completed?: boolean;
}

