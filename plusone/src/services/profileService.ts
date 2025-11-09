import { api } from "./http";
import type { ProfileResponse, ProfileUpdatePayload } from "../types/profile";

export const profileService = {
  async getProfile(userId: string): Promise<ProfileResponse> {
    const { data } = await api.get<ProfileResponse>(`/users/${userId}/profile`);
    return data;
  },
  async updateProfile(userId: string, payload: ProfileUpdatePayload): Promise<ProfileResponse> {
    const { data } = await api.put<ProfileResponse>(`/users/${userId}/profile`, payload);
    return data;
  },
};

