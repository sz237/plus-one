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
};
