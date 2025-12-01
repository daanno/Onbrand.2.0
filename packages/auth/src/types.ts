export interface User {
  id: string;
  email: string;
  user_metadata?: {
    brand_id?: string;
    full_name?: string;
  };
}

export interface BrandUser {
  id: string;
  user_id: string;
  brand_id: string;
  role: "owner" | "admin" | "editor" | "reviewer" | "user";
  created_at: string;
}

export type BrandRole = "owner" | "admin" | "editor" | "reviewer" | "user";

