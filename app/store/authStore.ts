import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppRole = "admin" | "gestor" | "vendedor";

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    role?: AppRole;
  };
  created_at: string;
  updated_at: string;
}

/** Rol del usuario en el ERP. Por defecto "admin" si no viene en user_metadata. */
export function getAppRole(user: User | null): AppRole {
  const role = user?.user_metadata?.role;
  if (role === "gestor" || role === "admin" || role === "vendedor") return role;
  return "admin";
}

/** Solo Renashop → Ventas; asignar `user_metadata.role = "vendedor"` en Supabase Auth. */
export function isVendedor(user: User | null): boolean {
  return getAppRole(user) === "vendedor";
}

export const VENDEDOR_VENTAS_PATH = "/renashop/ventas";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (userData) => {
        set({ user: userData, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
