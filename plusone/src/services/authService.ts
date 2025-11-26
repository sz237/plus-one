import { api } from "./http";

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
   token?: string;
}

// API functions
export const authService = {
  /**
   * Sign up a new user with Vanderbilt email
   */
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/signup', data);
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
      const response = await api.post<AuthResponse>('/auth/login', data);
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
      const response = await api.get('/auth/test');
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
