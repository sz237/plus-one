import axios from "axios";

// Safely read Vite env vars (browser & dev)
const viteBaseUrl =
  typeof import.meta !== "undefined" &&
  (import.meta as any).env &&
  (import.meta as any).env.VITE_API_BASE_URL;

// Safely read Node/Jest env vars (no-op in the browser)
const nodeBaseUrl =
  typeof process !== "undefined" &&
  (process as any).env &&
  (process as any).env.VITE_API_BASE_URL;

export const API_BASE_URL =
  (viteBaseUrl as string | undefined) ||
  (nodeBaseUrl as string | undefined) ||
  "http://localhost:8080/api";

export const AUTH_TOKEN_KEY = "authToken";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const readToken = () => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

api.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});
