import axios from "axios";
import type { ProfileResponse, ProfileUpdatePayload } from "../types/profile";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

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

