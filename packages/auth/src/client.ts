import type { User } from "@khufushome/types";

export interface AuthClient {
  getUser: () => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
}

/**
 * Creates a Supabase auth client. The actual implementation will be
 * added in Phase 2 when @supabase/supabase-js is installed.
 */
export function createAuthClient(_supabaseUrl: string, _anonKey: string): AuthClient {
  return {
    getUser: async () => null,
    signIn: async () => {
      throw new Error("Auth not configured — implement in Phase 2");
    },
    signUp: async () => {
      throw new Error("Auth not configured — implement in Phase 2");
    },
    signOut: async () => {
      throw new Error("Auth not configured — implement in Phase 2");
    },
  };
}
