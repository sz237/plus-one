export type Category = "Events" | "Job opportunities" | "Internships" | "Housing" | "Other";

export interface Post {
  id?: string;
  userId: string;
  category: Category;
  title: string;
  description: string;
  imageUrl?: string | null;
  createdAt?: string;
  eventDate?: string | null;
}

