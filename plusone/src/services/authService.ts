import axios from 'axios';

// Backend API base URL
const API_BASE_URL = 'http://localhost:8080/api/auth';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Type definitions
export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

// API functions
export const authService = {
  /**
   * Sign up a new user with Vanderbilt email
   */
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/signup', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Network error. Please try again.');
    }
  },

  /**
   * Log in existing user
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/login', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Network error. Please try again.');
    }
  },

  /**
   * Test backend connection
   */
  test: async (): Promise<string> => {
    try {
      const response = await api.get('/test');
      return response.data;
    } catch (error) {
      throw new Error('Failed to connect to backend');
    }
  },
};

// Helper function to validate Vanderbilt email
export const isVanderbiltEmail = (email: string): boolean => {
  return email.toLowerCase().trim().endsWith('@vanderbilt.edu');
};


