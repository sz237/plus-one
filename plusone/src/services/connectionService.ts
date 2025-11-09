import type { ConnectionRequest } from "../types/connection";
import { api } from "./http";

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
    const { data } = await api.get<UserProfile[]>("/connections/recent-users", {
      params: { currentUserId },
    });
    return data;
  },

  // Create a connection request
  async createConnectionRequest(fromUserId: string, request: CreateConnectionRequest): Promise<ConnectionRequest> {
    const { data } = await api.post<ConnectionRequest>("/connections/request", request, {
      params: { fromUserId },
    });
    return data;
  },

  // Accept a connection request
  async acceptConnectionRequest(requestId: string, userId: string): Promise<ConnectionRequest> {
    const { data } = await api.post<ConnectionRequest>(`/connections/accept/${requestId}`, null, {
      params: { userId },
    });
    return data;
  },

  // Get connection status between two users
  async getConnectionStatus(fromUserId: string, toUserId: string): Promise<string> {
    const { data } = await api.get<string>("/connections/status", {
      params: { fromUserId, toUserId },
    });
    return data;
  },

  // Get pending connection requests for a user
  async getPendingRequests(userId: string): Promise<ConnectionRequest[]> {
    const { data } = await api.get<ConnectionRequest[]>("/connections/pending-requests", {
      params: { userId },
    });
    return data;
  },

  // Reject a connection request
  async rejectConnectionRequest(requestId: string, userId: string): Promise<ConnectionRequest> {
    const { data } = await api.post<ConnectionRequest>(`/connections/reject/${requestId}`, null, {
      params: { userId },
    });
    return data;
  }
};
