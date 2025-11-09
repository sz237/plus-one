import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // comes from env
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
