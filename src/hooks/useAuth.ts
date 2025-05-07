import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Operator {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthStore {
  operator: Operator | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      operator: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await fetch("/api/v1/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
          }

          const data = await response.json();
          set({ operator: data.operator, isAuthenticated: true });
        } catch (error) {
          throw error;
        }
      },

      logout: async () => {
        await fetch("/api/v1/auth/logout", { method: "POST" });
        set({ operator: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
