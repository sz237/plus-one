import axios from 'axios';
import type { ConnectionRequest } from "../types/connection";

const API_BASE_URL = 'http://localhost:8080/api/connections';

export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profile: {
    gender?: string | null;
    age?: number | null;
    location: {
      city: string;
      state: string;
      country: string;
    };
    job: {
      title: string;
      companiesName: string;
    };
    interests: string[];
    profilePhoto: {
      url?: string;
    };
  };
  createdAt: string;
}

export interface CreateConnectionRequest {
  toUserId: string;
  message: string;
}


export const connectionService = {
  // Get recent users for homepage
  async getRecentUsers(currentUserId: string): Promise<UserProfile[]> {
    const response = await axios.get(`${API_BASE_URL}/recent-users?currentUserId=${currentUserId}`);
    return response.data;
  },

  // Create a connection request
  async createConnectionRequest(fromUserId: string, request: CreateConnectionRequest): Promise<ConnectionRequest> {
    const response = await axios.post(`${API_BASE_URL}/request?fromUserId=${fromUserId}`, request);
    return response.data;
  },

  // Accept a connection request
  async acceptConnectionRequest(requestId: string, userId: string): Promise<ConnectionRequest> {
    const response = await axios.post(`${API_BASE_URL}/accept/${requestId}?userId=${userId}`);
    return response.data;
  },

  // Get connection status between two users
  async getConnectionStatus(fromUserId: string, toUserId: string): Promise<string> {
    const response = await axios.get(`${API_BASE_URL}/status?fromUserId=${fromUserId}&toUserId=${toUserId}`);
    return response.data;
  },

  // Get pending connection requests for a user
  async getPendingRequests(userId: string): Promise<ConnectionRequest[]> {
    const response = await axios.get(`${API_BASE_URL}/pending-requests?userId=${userId}`);
    return response.data;
  },

  // Reject a connection request
  async rejectConnectionRequest(requestId: string, userId: string): Promise<ConnectionRequest> {
    const response = await axios.post(`${API_BASE_URL}/reject/${requestId}?userId=${userId}`);
    return response.data;
  }
};
