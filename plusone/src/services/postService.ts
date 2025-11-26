import { api } from "./http";
import type { Post } from "../types/post";
import type { ProfileResponse } from "../types/profile";

export const postService = {
  async getProfile(userId: string): Promise<ProfileResponse> {
    const { data } = await api.get<ProfileResponse>(`/users/${userId}/profile`);
    return data;
  },
  async list(userId: string): Promise<Post[]> {
    const { data } = await api.get<Post[]>("/posts", { params: { userId } });
    return data;
  },
  async create(post: Post): Promise<Post> {
    const { data } = await api.post<Post>("/posts", post);
    return data;
  },
  async update(id: string, post: Post): Promise<Post> {
    const { data } = await api.put<Post>(`/posts/${id}`, post);
    return data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/posts/${id}`);
  },
  
  async getBookmarkedPosts(userId: string): Promise<Post[]> {
  const { data } = await api.get<Post[]>("/posts/bookmarked", {
    params: { userId },
  });
  return data;
},

  async bookmarkPost(userId: string, postId: string): Promise<void> {
    await api.post(`/posts/${postId}/bookmark`, null, {
      params: { userId },
    });
  },

  async unbookmarkPost(userId: string, postId: string): Promise<void> {
    await api.delete(`/posts/${postId}/bookmark`, {
      params: { userId },
    });
  },
};
