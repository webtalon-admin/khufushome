export type UserRole = "owner" | "member" | "guest";

export interface User {
  id: string;
  email: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}
